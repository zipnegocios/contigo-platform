/**
 * ResendEmailService — Transactional Email Templates
 *
 * HARDCODED COLORS (Bucket 3 Exception):
 * This service contains inline CSS colors in HTML email templates.
 * Email clients don't support CSS variables, so hardcoding hex values is necessary.
 * Colors are mapped to design tokens below.
 *
 * Color Mapping:
 * - #D4AF37 → var(--gold-600) (header gradient, buttons)
 * - #C49A27 → gold-600 blend (header gradient end)
 * - #e0e0e0 → neutral border
 * - #fafaf8 → var(--neutral-50) (body background)
 * - #2a2a2a → footer dark bg
 * - #ccc → footer text (gray)
 * - #1a1a1a → admin header dark
 *
 * See AUDIT_HARDCODED_COLORS.md (Bucket 3) for details.
 */

import { Resend } from 'resend'
import { Quote } from '@/core/entities/Quote'
import { Lead } from '@/core/entities/Lead'
import { IEmailService } from '@/core/services/IEmailService'

let resendInstance: Resend | null = null

function getResend(): Resend {
  if (resendInstance) return resendInstance
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    throw new Error('RESEND_API_KEY environment variable is not defined')
  }
  resendInstance = new Resend(apiKey)
  return resendInstance
}

export class ResendEmailService implements IEmailService {
  private siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

  private getFromAddress(): string {
    // Fallback must match a domain actually verified in Resend — currently
    // only the `updates.` subdomain is verified there (the apex domain isn't
    // yet), so this cannot be `noreply@contigoconstructions.com.au` without
    // the sends silently failing.
    return process.env.RESEND_FROM_EMAIL || 'noreply@updates.contigoconstructions.com.au'
  }

  async sendQuoteConfirmation(quote: Quote): Promise<void> {
    const resend = getResend()
    const trackingUrl = `${this.siteUrl}/quote-status/${quote.trackingToken}`

    // EMAIL TEMPLATE — hardcoded colors for email client compatibility
    // #D4AF37 = var(--gold-600) | #C49A27 = gold-600 blend | #fafaf8 = var(--neutral-50)
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
      from: this.getFromAddress(),
      to: quote.email.toString(),
      subject: 'Your Quote Request - Contigo Constructions',
      html: htmlContent,
    })
  }

  async sendAdminNotification(quote: Quote): Promise<void> {
    const resend = getResend()
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@contigoconstructions.com.au'

    // EMAIL TEMPLATE — hardcoded colors for email client compatibility
    // #1a1a1a = admin header dark | #D4AF37 = var(--gold-600) | #fafaf8 = var(--neutral-50)
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
      from: this.getFromAddress(),
      to: adminEmail,
      subject: `[New Quote] ${quote.service} - ${quote.name}`,
      html: htmlContent,
    })
  }

  async sendNewMessageNotificationToAdmin(lead: Lead, quote: Quote): Promise<void> {
    const resend = getResend()
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@contigoconstructions.com.au'
    const leadUrl = `${this.siteUrl}/admin/leads/${lead.id}`

    // EMAIL TEMPLATE — hardcoded colors for email client compatibility
    // #1a1a1a = admin header dark | #D4AF37 = var(--gold-600) | #fafaf8 = var(--neutral-50)
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
            .button { display: inline-block; background: #D4AF37; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>New Message from Client</h1>
            </div>
            <div class="body">
              <p><strong>The client has sent a new message on this lead:</strong></p>

              <div class="detail">
                <p><strong>Name:</strong> ${quote.name}</p>
              </div>
              <div class="detail">
                <p><strong>Service:</strong> ${quote.service}</p>
              </div>

              <p>Please log in to the admin panel to view the message and respond.</p>
              <p><a href="${leadUrl}" class="button">View Lead</a></p>
            </div>
          </div>
        </body>
      </html>
    `

    await resend.emails.send({
      from: this.getFromAddress(),
      to: adminEmail,
      subject: `[New Message] ${quote.service} — ${quote.name}`,
      html: htmlContent,
    })
  }

  async sendNewMessageNotificationToClient(quote: Quote): Promise<void> {
    const resend = getResend()
    const trackingUrl = `${this.siteUrl}/quote-status/${quote.trackingToken}`

    // EMAIL TEMPLATE — hardcoded colors for email client compatibility
    // #D4AF37 = var(--gold-600) | #C49A27 = gold-600 blend | #fafaf8 = var(--neutral-50)
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
              <h1>You Have a New Message</h1>
            </div>
            <div class="body">
              <p>Dear ${quote.name},</p>
              <p>Our team has sent you a new message regarding your <strong>${quote.service}</strong> project.</p>

              <p>Please visit your tracking page to view the message and reply:</p>
              <p><a href="${trackingUrl}" class="button">View Message</a></p>

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
      from: this.getFromAddress(),
      to: quote.email.toString(),
      subject: `New message about your ${quote.service} project`,
      html: htmlContent,
    })
  }
}
