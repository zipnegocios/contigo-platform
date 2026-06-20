import {
  S3Client,
  PutObjectCommand,
  ListObjectsV2Command,
  DeleteObjectCommand,
  CopyObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { inferMediaType } from '@/presentation/lib/inferMediaType'

export interface R2MediaObject {
  key: string
  size: number
  lastModified: Date
  publicUrl: string
  mediaType: 'image' | 'video' | 'other'
}

let r2Client: S3Client | null = null

function getR2Client(): S3Client {
  if (r2Client) return r2Client

  const accountId = process.env.R2_ACCOUNT_ID
  const accessKeyId = process.env.R2_ACCESS_KEY_ID
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY

  if (!accountId || !accessKeyId || !secretAccessKey) {
    throw new Error('R2 credentials not configured. Set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY.')
  }

  r2Client = new S3Client({
    region: 'auto',
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey },
    // SDK v3 defaults to 'when_supported', which adds x-amz-checksum-crc32 to
    // presigned URLs. The browser XHR doesn't send a matching header, so R2
    // rejects the PUT with 400. 'when_required' disables automatic checksums.
    requestChecksumCalculation: 'WHEN_REQUIRED' as const,
    responseChecksumValidation: 'WHEN_REQUIRED' as const,
  })

  return r2Client
}

/**
 * Generates a presigned PUT URL for direct browser-to-R2 upload.
 * The browser uploads the file directly to R2; no bytes pass through Next.js.
 *
 * @param bucket - R2 bucket name (e.g. 'contigo-assets')
 * @param key - Object key (path within bucket)
 * @param contentType - MIME type of the file
 * @param expiresIn - URL validity in seconds (default: 5 minutes)
 */
export async function generatePresignedPutUrl(
  bucket: string,
  key: string,
  contentType: string,
  expiresIn = 300,
): Promise<string> {
  const client = getR2Client()
  // ContentType is intentionally omitted from the signed command.
  // R2 enforces signed headers strictly — if included here, any Content-Type
  // mismatch between the signed value and the actual PUT request causes 400.
  // The client sets Content-Type in the XHR headers directly, which R2 stores
  // without requiring it to be in the presigned signature.
  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
  })
  return getSignedUrl(client, command, { expiresIn })
}

/**
 * Generates a presigned GET URL for reading a private object directly from
 * the browser (e.g. previewing/downloading a quote attachment stored in a
 * private bucket).
 *
 * @param bucket - R2 bucket name
 * @param key - Object key (path within bucket)
 * @param expiresIn - URL validity in seconds (default: 5 minutes)
 */
export async function generatePresignedGetUrl(
  bucket: string,
  key: string,
  expiresIn = 300,
): Promise<string> {
  const client = getR2Client()
  const command = new GetObjectCommand({ Bucket: bucket, Key: key })
  return getSignedUrl(client, command, { expiresIn })
}

/**
 * Lists objects in a bucket under the given prefix.
 */
export async function listObjects(
  bucket: string,
  prefix?: string,
  maxKeys = 200,
): Promise<R2MediaObject[]> {
  const client = getR2Client()
  const assetsUrl = process.env.NEXT_PUBLIC_ASSETS_URL || 'https://assets.contigoconstructions.com.au'

  const command = new ListObjectsV2Command({
    Bucket: bucket,
    Prefix: prefix,
    MaxKeys: maxKeys,
  })

  const response = await client.send(command)
  const contents = response.Contents ?? []

  return contents
    .filter((obj) => obj.Key && obj.Size !== undefined)
    .map((obj) => {
      const key = obj.Key!
      const mediaType = inferMediaType(key)

      return {
        key,
        size: obj.Size ?? 0,
        lastModified: obj.LastModified ?? new Date(),
        publicUrl: `${assetsUrl}/${key}`,
        mediaType,
      }
    })
}

/**
 * Deletes an object from a bucket.
 */
export async function deleteObject(bucket: string, key: string): Promise<void> {
  const client = getR2Client()
  await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }))
}

/**
 * Renames all objects under oldPrefix to newPrefix (copy + delete).
 * Returns a Map<oldUrl, newUrl> so callers can update DB references.
 */
export async function renamePrefix(
  bucket: string,
  oldPrefix: string,
  newPrefix: string,
): Promise<Map<string, string>> {
  const client = getR2Client()
  const assetsUrl = process.env.NEXT_PUBLIC_ASSETS_URL || 'https://assets.contigoconstructions.com.au'

  const listCmd = new ListObjectsV2Command({ Bucket: bucket, Prefix: oldPrefix, MaxKeys: 1000 })
  const listRes = await client.send(listCmd)
  const objects = listRes.Contents ?? []

  const urlMap = new Map<string, string>()
  const oldKeys: string[] = []

  for (const obj of objects) {
    if (!obj.Key) continue
    const suffix = obj.Key.slice(oldPrefix.length)
    const newKey = `${newPrefix}${suffix}`
    await client.send(new CopyObjectCommand({
      Bucket: bucket,
      CopySource: `${bucket}/${obj.Key}`,
      Key: newKey,
    }))
    urlMap.set(`${assetsUrl}/${obj.Key}`, `${assetsUrl}/${newKey}`)
    oldKeys.push(obj.Key)
  }

  for (const key of oldKeys) {
    await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }))
  }

  return urlMap
}

/**
 * Builds a deterministic, URL-safe storage key.
 *
 * Example: buildKey('projects/cover', 'My Photo.JPG')
 *       => 'projects/cover/a1b2c3d4-my-photo.jpg'
 */
export function buildKey(prefix: string, originalFilename: string): string {
  const shortId = crypto.randomUUID().split('-')[0]
  const sanitised = originalFilename
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9.-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
  return `${prefix}/${shortId}-${sanitised}`
}
