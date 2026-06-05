import { Resend } from 'resend'
import { Quote } from '@/core/entities/Quote'
import { IEmailService } from '@/core/services/IEmailService'

const resend = new Resend(process.env.RESEND_API_KEY)

export class ResendEmailService implements IEmailService {
  private siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

  async sendQuoteConfirmation(quote: Quote): Promise<void> {
    const trackingUrl = `${this.siteUrl}/quote-status/${quote.trackingToken}`

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: system-ui, -apple-system, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #D4AF37 0%, #C49A27 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; }
            .body { border: 1px solid #e0e0e0; padding: 20px; background: #fafaf8; }
            .footer { background: #2a2a2a; color: #ccc; padding: 15px; text-align: center; font-size: 12px; border-radius: 0 0 8px 8px; }
            .button { display: inline-block; background: #D4AF37; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Thank You for Your Inquiry</h1>
            </div>
            <div class="body">
              <p>Dear ${quote.name},</p>
              <p>We've received your quote request for <strong>${quote.service}</strong>. Our team will review your project details and get back to you shortly.</p>

              <h3>Your Details:</h3>
              <ul>
                <li><strong>Service:</strong> ${quote.service}</li>
                <li><strong>Email:</strong> ${quote.email.toString()}</li>
                ${quote.phone ? `<li><strong>Phone:</strong> ${quote.phone.toString()}</li>` : ''}
              </ul>

              <p><strong>Tracking Your Quote:</strong></p>
              <p>You can check the status of your quote at any time using the link below:</p>
              <p><a href="${trackingUrl}" class="button">View Quote Status</a></p>

              <p>If you have any questions in the meantime, please don't hesitate to reach out.</p>
              <p>Best regards,<br><strong>Contigo Constructions</strong></p>
            </div>
            <div class="footer">
              <p>&copy; 2025 Contigo Constructions. All rights reserved.</p>
              <p>25 Green Avenue, Seaton SA 5023 | (08) 8123 4567</p>
            </div>
          </div>
        </body>
      </html>
    `

    await resend.emails.send({
      from: 'noreply@contigo-constructions.com.au',
      to: quote.email.toString(),
      subject: 'Your Quote Request - Contigo Constructions',
      html: htmlContent,
    })
  }

  async sendAdminNotification(quote: Quote): Promise<void> {
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@contigo-constructions.com.au'

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: system-ui, -apple-system, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #1a1a1a; color: #D4AF37; padding: 20px; border-radius: 8px 8px 0 0; }
            .body { border: 1px solid #e0e0e0; padding: 20px; background: #fafaf8; }
            .detail { background: white; padding: 10px; margin: 10px 0; border-left: 4px solid #D4AF37; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>New Quote Request</h1>
            </div>
            <div class="body">
              <p><strong>A new quote request has been submitted:</strong></p>

              <div class="detail">
                <p><strong>Name:</strong> ${quote.name}</p>
              </div>
              <div class="detail">
                <p><strong>Email:</strong> ${quote.email.toString()}</p>
              </div>
              ${quote.phone ? `<div class="detail"><p><strong>Phone:</strong> ${quote.phone.toString()}</p></div>` : ''}
              <div class="detail">
                <p><strong>Service:</strong> ${quote.service}</p>
              </div>
              <div class="detail">
                <p><strong>Message:</strong><br>${quote.message.replace(/\n/g, '<br>')}</p>
              </div>

              <p><strong>Tracking Token:</strong> ${quote.trackingToken}</p>
              <p><strong>Quote ID:</strong> ${quote.id}</p>
              <p><strong>Submitted:</strong> ${quote.createdAt.toLocaleString()}</p>
            </div>
          </div>
        </body>
      </html>
    `

    await resend.emails.send({
      from: 'noreply@contigo-constructions.com.au',
      to: adminEmail,
      subject: `[New Quote] ${quote.service} - ${quote.name}`,
      html: htmlContent,
    })
  }
}
