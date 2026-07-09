import { IGoogleBusinessProfileService, GoogleReviewApiItem } from '@/core/services/IGoogleBusinessProfileService'

/** Refresh token revoked/invalid — dashboard should surface "Reconnect required". */
export class GbpAuthError extends Error {}

/** Rate limit / access-not-yet-approved (see plan Phase 0 §3.3) — caller should log and back off, not retry immediately. */
export class GbpQuotaError extends Error {}

/** Transient 5xx exhausted after retries. */
export class GbpTransientError extends Error {}

const TOKEN_URL = 'https://oauth2.googleapis.com/token'
const ACCOUNTS_URL = 'https://mybusinessaccountmanagement.googleapis.com/v1/accounts'
const REVIEWS_BASE_URL = 'https://mybusiness.googleapis.com/v4'
const PAGE_SIZE = 50
const MAX_RETRIES = 3

const STAR_RATING_MAP: Record<string, number> = {
  ONE: 1,
  TWO: 2,
  THREE: 3,
  FOUR: 4,
  FIVE: 5,
}

interface CachedToken {
  accessToken: string
  expiresAt: number // epoch ms
}

let cachedToken: CachedToken | null = null
let cachedAccountName: string | null = null // e.g. "accounts/121307221241..."

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function requestJson(url: string, init: RequestInit, attempt = 1): Promise<any> {
  const res = await fetch(url, init)

  if (res.status === 429) {
    const body = await res.text()
    throw new GbpQuotaError(`Quota exceeded (429): ${body}`)
  }

  if (res.status === 401 || res.status === 403) {
    const body = await res.text()
    throw new GbpAuthError(`Auth failure (${res.status}): ${body}`)
  }

  if (res.status >= 500 && res.status < 600) {
    if (attempt >= MAX_RETRIES) {
      const body = await res.text()
      throw new GbpTransientError(`Transient error after ${attempt} attempts (${res.status}): ${body}`)
    }
    await sleep(2 ** attempt * 500)
    return requestJson(url, init, attempt + 1)
  }

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`GBP request failed (${res.status}): ${body}`)
  }

  if (res.status === 204) return null
  return res.json()
}

export class GoogleBusinessProfileService implements IGoogleBusinessProfileService {
  private get clientId(): string {
    const value = process.env.GOOGLE_CLIENT_ID
    if (!value) throw new Error('GOOGLE_CLIENT_ID environment variable is not defined')
    return value
  }

  private get clientSecret(): string {
    const value = process.env.GOOGLE_CLIENT_SECRET
    if (!value) throw new Error('GOOGLE_CLIENT_SECRET environment variable is not defined')
    return value
  }

  private get refreshToken(): string {
    const value = process.env.GOOGLE_REFRESH_TOKEN
    if (!value) throw new Error('GOOGLE_REFRESH_TOKEN environment variable is not defined')
    return value
  }

  private get locationId(): string {
    const value = process.env.GOOGLE_LOCATION_ID
    if (!value) throw new Error('GOOGLE_LOCATION_ID environment variable is not defined')
    return value
  }

  private async getAccessToken(): Promise<string> {
    const now = Date.now()
    if (cachedToken && cachedToken.expiresAt > now + 60_000) {
      return cachedToken.accessToken
    }

    const body = new URLSearchParams({
      client_id: this.clientId,
      client_secret: this.clientSecret,
      refresh_token: this.refreshToken,
      grant_type: 'refresh_token',
    })

    const json = await requestJson(TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    })

    cachedToken = {
      accessToken: json.access_token,
      expiresAt: now + json.expires_in * 1000,
    }
    return cachedToken.accessToken
  }

  /**
   * `accounts/me` is not a valid v4 alias for the reviews endpoint (plan §3
   * point 2) — the numeric account resource name must be resolved via
   * accounts.list first. Cached in-memory for the process lifetime.
   */
  private async getAccountName(): Promise<string> {
    if (cachedAccountName) return cachedAccountName

    const accessToken = await this.getAccessToken()
    const json = await requestJson(ACCOUNTS_URL, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })

    const accountName: string | undefined = json.accounts?.[0]?.name
    if (!accountName) {
      throw new Error('No Google Business Profile account found for this refresh token')
    }
    cachedAccountName = accountName
    return accountName
  }

  async listReviews(): Promise<GoogleReviewApiItem[]> {
    const accessToken = await this.getAccessToken()
    const accountName = await this.getAccountName()

    const items: GoogleReviewApiItem[] = []
    let pageToken: string | undefined

    do {
      const url = new URL(`${REVIEWS_BASE_URL}/${accountName}/locations/${this.locationId}/reviews`)
      url.searchParams.set('pageSize', String(PAGE_SIZE))
      if (pageToken) url.searchParams.set('pageToken', pageToken)

      const json = await requestJson(url.toString(), {
        headers: { Authorization: `Bearer ${accessToken}` },
      })

      for (const review of json.reviews ?? []) {
        items.push({
          googleReviewId: review.name,
          reviewerName: review.reviewer?.displayName ?? 'Anonymous',
          reviewerAvatarUrl: review.reviewer?.profilePhotoUrl ?? null,
          reviewerProfileUrl: null,
          rating: STAR_RATING_MAP[review.starRating] ?? 0,
          comment: review.comment ?? null,
          reviewCreatedAt: new Date(review.createTime),
          reviewUpdatedAt: new Date(review.updateTime),
          language: null,
          ownerReply: review.reviewReply?.comment ?? null,
          ownerReplyAt: review.reviewReply?.updateTime ? new Date(review.reviewReply.updateTime) : null,
        })
      }

      pageToken = json.nextPageToken
    } while (pageToken)

    return items
  }

  async updateReply(googleReviewId: string, comment: string): Promise<void> {
    const accessToken = await this.getAccessToken()
    await requestJson(`${REVIEWS_BASE_URL}/${googleReviewId}/reply`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ comment }),
    })
  }

  async deleteReply(googleReviewId: string): Promise<void> {
    const accessToken = await this.getAccessToken()
    await requestJson(`${REVIEWS_BASE_URL}/${googleReviewId}/reply`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${accessToken}` },
    })
  }
}
