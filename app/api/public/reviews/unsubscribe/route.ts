import { DrizzleReviewRequestSuppressionRepository } from '@/infrastructure/repositories/DrizzleReviewRequestSuppressionRepository'
import { verifyUnsubscribeToken } from '@/infrastructure/services/reviewUnsubscribeToken'

function htmlResponse(message: string, status: number): Response {
  return new Response(
    `<!DOCTYPE html><html><body style="font-family:sans-serif;max-width:480px;margin:80px auto;text-align:center;color:#2D2924;">
      <p>${message}</p>
    </body></html>`,
    { status, headers: { 'Content-Type': 'text/html; charset=utf-8' } },
  )
}

export async function GET(request: Request) {
  const url = new URL(request.url)
  const email = url.searchParams.get('email')
  const token = url.searchParams.get('token')

  if (!email || !token || !verifyUnsubscribeToken(email, token)) {
    return htmlResponse('This unsubscribe link is invalid or has expired.', 400)
  }

  try {
    await new DrizzleReviewRequestSuppressionRepository().suppress(email)
    return htmlResponse(`${email} has been unsubscribed from review request emails.`, 200)
  } catch (error) {
    console.error('Error processing review request unsubscribe:', error)
    return htmlResponse('Something went wrong processing your request. Please contact us directly.', 500)
  }
}
