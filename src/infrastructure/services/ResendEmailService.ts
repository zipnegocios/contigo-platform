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
import { LeadEvent, LeadEventType } from '@/core/entities/LeadEvent'
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

const EVENT_TYPE_LABELS: Record<LeadEventType, string> = {
  call: 'Call',
  site_visit: 'Site Visit',
  meeting: 'Meeting',
  follow_up: 'Follow-up',
}

const CHANNEL_LABELS: Record<'google_meet' | 'zoom' | 'teams' | 'whatsapp' | 'other', string> = {
  google_meet: 'Google Meet',
  zoom: 'Zoom',
  teams: 'Microsoft Teams',
  whatsapp: 'WhatsApp video call',
  other: 'Other',
}

// Matches the date-format convention used in the client tracking portal
// (src/presentation/components/portal/TrackingScheduleList.tsx).
function formatEventDateTime(date: Date): string {
  return new Date(date).toLocaleString('en-AU', {
    timeZone: 'Australia/Adelaide',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// Builds the operationally-necessary metadata lines for a scheduled event
// (structured fields only — meeting channel/link, site-visit address/maps/reference
// point). Deliberately NEVER includes event.notes (internal free-text commentary)
// or metadata.contactId (internal reference id) in any recipient-facing email.
function buildEventDetailLines(event: LeadEvent): string[] {
  const lines: string[] = []
  if (event.location) lines.push(`<strong>Location:</strong> ${event.location}`)

  const meta = event.metadata
  if (meta.kind === 'meeting') {
    lines.push(`<strong>Join via:</strong> ${CHANNEL_LABELS[meta.channel]}`)
    if (meta.link) lines.push(`<strong>Link:</strong> <a href="${meta.link}">${meta.link}</a>`)
  } else if (meta.kind === 'site_visit') {
    if (meta.address) lines.push(`<strong>Address:</strong> ${meta.address}`)
    if (meta.mapsLink) lines.push(`<strong>Maps:</strong> <a href="${meta.mapsLink}">View on Maps</a>`)
    if (meta.referencePoint) lines.push(`<strong>Reference Point:</strong> ${meta.referencePoint}`)
  }

  return lines
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

  async sendStageChangeNotificationToClient(quote: Quote, stageLabel: string): Promise<void> {
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
              <h1>Your Project Status Has Been Updated</h1>
            </div>
            <div class="body">
              <p>Dear ${quote.name},</p>
              <p>The status of your <strong>${quote.service}</strong> project is now <strong>${stageLabel}</strong>.</p>

              <p>You can view the full details on your tracking page:</p>
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
      subject: 'Your project status has been updated',
      html: htmlContent,
    })
  }

  async sendStageChangeNotificationToAdmin(lead: Lead, quote: Quote, fromLabel: string, toLabel: string): Promise<void> {
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
              <h1>Lead Status Updated</h1>
            </div>
            <div class="body">
              <p><strong>This lead's status has changed:</strong></p>

              <div class="detail">
                <p><strong>Name:</strong> ${quote.name}</p>
              </div>
              <div class="detail">
                <p><strong>Service:</strong> ${quote.service}</p>
              </div>
              <div class="detail">
                <p><strong>${fromLabel}</strong> &rarr; <strong>${toLabel}</strong></p>
              </div>

              <p><a href="${leadUrl}" class="button">View Lead</a></p>
            </div>
          </div>
        </body>
      </html>
    `

    await resend.emails.send({
      from: this.getFromAddress(),
      to: adminEmail,
      subject: `[Status Update] ${quote.service} — ${quote.name}`,
      html: htmlContent,
    })
  }

  async sendEventScheduledNotificationToClient(quote: Quote, event: LeadEvent): Promise<void> {
    const resend = getResend()
    const trackingUrl = `${this.siteUrl}/quote-status/${quote.trackingToken}`
    const detailLines = buildEventDetailLines(event)

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
              <h1>New Appointment Scheduled</h1>
            </div>
            <div class="body">
              <p>Dear ${quote.name},</p>
              <p>A new appointment has been scheduled for your <strong>${quote.service}</strong> project.</p>

              <ul>
                <li><strong>Type:</strong> ${EVENT_TYPE_LABELS[event.type]}</li>
                <li><strong>When:</strong> ${formatEventDateTime(event.scheduledAt)}</li>
                <li><strong>Duration:</strong> ${event.durationMinutes} min</li>
                ${detailLines.map((line) => `<li>${line}</li>`).join('\n                ')}
              </ul>

              <p>You can view the full schedule on your tracking page:</p>
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
      subject: 'New appointment scheduled for your project',
      html: htmlContent,
    })
  }

  async sendEventScheduledNotificationToAdmin(lead: Lead, quote: Quote, event: LeadEvent): Promise<void> {
    const resend = getResend()
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@contigoconstructions.com.au'
    const leadUrl = `${this.siteUrl}/admin/leads/${lead.id}`
    const detailLines = buildEventDetailLines(event)

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
              <h1>New Appointment Scheduled</h1>
            </div>
            <div class="body">
              <p><strong>A new appointment has been scheduled for this lead:</strong></p>

              <div class="detail">
                <p><strong>Name:</strong> ${quote.name}</p>
              </div>
              <div class="detail">
                <p><strong>Service:</strong> ${quote.service}</p>
              </div>
              <div class="detail">
                <p><strong>Type:</strong> ${EVENT_TYPE_LABELS[event.type]}</p>
              </div>
              <div class="detail">
                <p><strong>When:</strong> ${formatEventDateTime(event.scheduledAt)}</p>
              </div>
              <div class="detail">
                <p><strong>Duration:</strong> ${event.durationMinutes} min</p>
              </div>
              ${detailLines.map((line) => `<div class="detail"><p>${line}</p></div>`).join('\n              ')}

              <p><a href="${leadUrl}" class="button">View Lead</a></p>
            </div>
          </div>
        </body>
      </html>
    `

    await resend.emails.send({
      from: this.getFromAddress(),
      to: adminEmail,
      subject: `[Schedule Update] ${quote.service} — ${quote.name}`,
      html: htmlContent,
    })
  }

  async sendEventUpdatedNotificationToClient(quote: Quote, event: LeadEvent): Promise<void> {
    const resend = getResend()
    const trackingUrl = `${this.siteUrl}/quote-status/${quote.trackingToken}`
    void event // intentionally unused — this is a generic notice, not a diff of old vs. new fields

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
              <h1>Your Appointment Details Have Changed</h1>
            </div>
            <div class="body">
              <p>Dear ${quote.name},</p>
              <p>Your appointment details have changed for your <strong>${quote.service}</strong> project — please review the updated schedule on your tracking page.</p>

              <p><a href="${trackingUrl}" class="button">View Updated Schedule</a></p>

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
      subject: 'Your appointment details have changed',
      html: htmlContent,
    })
  }

  async sendEventUpdatedNotificationToAdmin(lead: Lead, quote: Quote, event: LeadEvent): Promise<void> {
    const resend = getResend()
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@contigoconstructions.com.au'
    const leadUrl = `${this.siteUrl}/admin/leads/${lead.id}`
    void event // intentionally unused — this is a generic notice, not a diff of old vs. new fields

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
              <h1>Appointment Details Updated</h1>
            </div>
            <div class="body">
              <p><strong>The schedule for this lead has changed:</strong></p>

              <div class="detail">
                <p><strong>Name:</strong> ${quote.name}</p>
              </div>
              <div class="detail">
                <p><strong>Service:</strong> ${quote.service}</p>
              </div>

              <p>Please log in to the admin panel to review the updated schedule.</p>
              <p><a href="${leadUrl}" class="button">View Lead</a></p>
            </div>
          </div>
        </body>
      </html>
    `

    await resend.emails.send({
      from: this.getFromAddress(),
      to: adminEmail,
      subject: `[Schedule Update] ${quote.service} — ${quote.name}`,
      html: htmlContent,
    })
  }

  async sendEventCancelledNotificationToClient(quote: Quote, event: LeadEvent): Promise<void> {
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
              <h1>Your Appointment Has Been Cancelled</h1>
            </div>
            <div class="body">
              <p>Dear ${quote.name},</p>
              <p>The <strong>${EVENT_TYPE_LABELS[event.type]}</strong> originally scheduled for <strong>${formatEventDateTime(event.scheduledAt)}</strong> for your <strong>${quote.service}</strong> project has been cancelled.</p>

              <p>You can view your current schedule on your tracking page:</p>
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
      subject: 'Your appointment has been cancelled',
      html: htmlContent,
    })
  }

  async sendEventCancelledNotificationToAdmin(lead: Lead, quote: Quote, event: LeadEvent): Promise<void> {
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
              <h1>Appointment Cancelled</h1>
            </div>
            <div class="body">
              <p><strong>An appointment for this lead has been cancelled:</strong></p>

              <div class="detail">
                <p><strong>Name:</strong> ${quote.name}</p>
              </div>
              <div class="detail">
                <p><strong>Service:</strong> ${quote.service}</p>
              </div>
              <div class="detail">
                <p><strong>Type:</strong> ${EVENT_TYPE_LABELS[event.type]}</p>
              </div>
              <div class="detail">
                <p><strong>Was Scheduled For:</strong> ${formatEventDateTime(event.scheduledAt)}</p>
              </div>

              <p><a href="${leadUrl}" class="button">View Lead</a></p>
            </div>
          </div>
        </body>
      </html>
    `

    await resend.emails.send({
      from: this.getFromAddress(),
      to: adminEmail,
      subject: `[Schedule Update] ${quote.service} — ${quote.name}`,
      html: htmlContent,
    })
  }
}
