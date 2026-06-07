import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

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
  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    ContentType: contentType,
  })
  return getSignedUrl(client, command, { expiresIn })
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
