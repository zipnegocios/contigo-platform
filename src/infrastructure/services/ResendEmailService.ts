/**
 * ResendEmailService — Transactional Email Templates
 *
 * HARDCODED COLORS (Bucket 3 Exception):
 * This service contains inline CSS colors in HTML email templates.
 * Email clients don't support CSS variables, so hardcoding hex values is necessary.
 * Colors are mapped to design tokens below.
 *
 * Color Mapping:
 * - #0D3C4C → var(--petrol-800) (shared header/footer background, renderEmailShell)
 * - #D4AF37 → var(--gold-600) (buttons, gold logo asset)
 * - #E2C063 → var(--gold-400) (footer links)
 * - #e0e0e0 → neutral border
 * - #fafaf8 → var(--neutral-50) (body background)
 *
 * See AUDIT_HARDCODED_COLORS.md (Bucket 3) for details.
 */

import { Resend } from 'resend'
import { Quote } from '@/core/entities/Quote'
import { Lead } from '@/core/entities/Lead'
import { LeadEvent, LeadEventType } from '@/core/entities/LeadEvent'
import { IEmailService } from '@/core/services/IEmailService'
import { extractAddressFromFormData } from '@/presentation/lib/addressExtractor'

const EVENT_TYPE_LABELS: Record<LeadEventType, string> = {
  call: 'Call',
  site_visit: 'Site Visit',
  meeting: 'Meeting',
  follow_up: 'Follow-up',
}

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

  private getFromEmail(): string {
    // Fallback must match a domain actually verified in Resend — currently
    // only the `updates.` subdomain is verified there (the apex domain isn't
    // yet), so this cannot be `noreply@contigoconstructions.com.au` without
    // the sends silently failing.
    return process.env.RESEND_FROM_EMAIL || 'noreply@updates.contigoconstructions.com.au'
  }

  // Purpose-specific sender display name so recipients see e.g. "Contigo
  // Constructions | Quotes" instead of a bare address (which mail clients
  // were rendering as just "Contact" with no display name set at all).
  private getFromAddress(purpose: 'Quotes' | 'New Quotes' | 'Messages' | 'Updates' | 'Scheduling' | 'Reviews' | 'Account'): string {
    return `Contigo Constructions | ${purpose} <${this.getFromEmail()}>`
  }

  private renderEmailShell(title: string, bodyHtml: string): string {
    const mainLogoUrl = `${this.siteUrl}/assets/logos/email/logo-main-gold.png`
    const iconLogoUrl = `${this.siteUrl}/assets/logos/email/logo-icon-white.png`
    const year = new Date().getFullYear()

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: system-ui, -apple-system, sans-serif; line-height: 1.6; color: #333; margin: 0; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #0D3C4C; padding: 24px 20px; border-radius: 8px 8px 0 0; text-align: center; }
            .header img { display: block; margin: 0 auto 12px; }
            .header h1 { color: #ffffff; font-size: 20px; margin: 0; }
            .body { border: 1px solid #e0e0e0; padding: 20px; background: #fafaf8; }
            .footer { background: #0D3C4C; color: #cfd8db; padding: 20px; text-align: center; font-size: 12px; border-radius: 0 0 8px 8px; }
            .footer img { display: block; margin: 0 auto 12px; }
            .footer a { color: #E2C063; }
            .footer p { margin: 4px 0; }
            .button { display: inline-block; background: #D4AF37; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold; }
            .detail { background: white; padding: 10px; margin: 10px 0; border-left: 4px solid #D4AF37; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <img src="${mainLogoUrl}" width="200" height="180" alt="Contigo Constructions">
              <h1>${title}</h1>
            </div>
            <div class="body">
              ${bodyHtml}
            </div>
            <div class="footer">
              <img src="${iconLogoUrl}" width="140" height="97" alt="Contigo Constructions">
              <p>This is an automated message — please don't reply directly to this email.</p>
              <p>Need to get in touch? Email us at <a href="mailto:contact@contigoconstructions.com.au">contact@contigoconstructions.com.au</a> </p>
              <p>or WhatsApp us at <a href="https://wa.me/61406274096">+61 406 274 096</a>.</p>
              <p>76 Coorara Avenue, Payneham South SA 5070</p>
              <p>&copy; ${year} Contigo Constructions. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `
  }

  async sendQuoteConfirmation(quote: Quote): Promise<void> {
    try {
      const resend = getResend()
      const trackingUrl = `${this.siteUrl}/quote-status/${quote.trackingToken}`
      const address = extractAddressFromFormData(quote?.formData)
      const mapsUrl = address ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}` : ''

      const bodyHtml = `
        <p>Dear ${quote.name},</p>
        <p>We've received your quote request for <strong>${quote.service}</strong>. Our team will review your project details and get back to you shortly.</p>

        <h3>Your Details:</h3>
        <ul>
          <li><strong>Service:</strong> ${quote.service}</li>
          <li><strong>Email:</strong> ${quote.email.toString()}</li>
          ${quote.phone ? `<li><strong>Phone:</strong> ${quote.phone.toString()}</li>` : ''}
          ${address ? `<li><strong>Address:</strong> ${address} (<a href="${mapsUrl}" target="_blank" style="color: #D4AF37; text-decoration: underline;">View on Google Maps</a>)</li>` : ''}
        </ul>

        <p><strong>Tracking Your Quote:</strong></p>
        <p>You can check the status of your quote at any time using the link below:</p>
        <p><a href="${trackingUrl}" class="button">View Quote Status</a></p>

        <p>If you have any questions in the meantime, please don't hesitate to reach out.</p>
        <p>Best regards,<br><strong>Contigo Constructions</strong></p>
      `

      await resend.emails.send({
        from: this.getFromAddress('Quotes'),
        to: quote.email.toString(),
        subject: 'Your Quote Request - Contigo Constructions',
        html: this.renderEmailShell('Thank You for Your Inquiry', bodyHtml),
      })
    } catch (error) {
      console.error('Error sending quote confirmation email:', error)
    }
  }

  async sendAdminNotification(quote: Quote): Promise<void> {
    try {
      const resend = getResend()
      const adminEmail = process.env.ADMIN_EMAIL || 'contact@contigoconstructions.com.au'
      const address = extractAddressFromFormData(quote?.formData)
      const mapsUrl = address ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}` : ''

      const bodyHtml = `
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
        ${address ? `
        <div class="detail">
          <p><strong>Address:</strong> ${address}</p>
          <p><a href="${mapsUrl}" target="_blank" class="button" style="padding: 6px 12px; font-size: 13px;">View on Google Maps</a></p>
        </div>` : ''}
        <div class="detail">
          <p><strong>Message:</strong><br>${(quote.message || '').replace(/\n/g, '<br>')}</p>
        </div>

        <p><strong>Tracking Token:</strong> ${quote.trackingToken}</p>
        <p><strong>Quote ID:</strong> ${quote.id}</p>
        <p><strong>Submitted:</strong> ${quote.createdAt.toLocaleString()}</p>
      `

      await resend.emails.send({
        from: this.getFromAddress('New Quotes'),
        to: adminEmail,
        subject: `[New Quote] ${quote.service} - ${quote.name}`,
        html: this.renderEmailShell('New Quote Request', bodyHtml),
      })
    } catch (error) {
      console.error('Error sending admin notification email:', error)
    }
  }

  async sendNewMessageNotificationToAdmin(lead: Lead, quote: Quote): Promise<void> {
    const resend = getResend()
    const adminEmail = process.env.ADMIN_EMAIL || 'contact@contigoconstructions.com.au'
    const leadUrl = `${this.siteUrl}/admin/leads/${lead.id}`

    const bodyHtml = `
      <p><strong>The client has sent a new message on this lead:</strong></p>

      <div class="detail">
        <p><strong>Name:</strong> ${quote.name}</p>
      </div>
      <div class="detail">
        <p><strong>Service:</strong> ${quote.service}</p>
      </div>

      <p>Please log in to the admin panel to view the message and respond.</p>
      <p><a href="${leadUrl}" class="button">View Lead</a></p>
    `

    await resend.emails.send({
      from: this.getFromAddress('Messages'),
      to: adminEmail,
      subject: `[New Message] ${quote.service} — ${quote.name}`,
      html: this.renderEmailShell('New Message from Client', bodyHtml),
    })
  }

  async sendNewMessageNotificationToClient(quote: Quote): Promise<void> {
    const resend = getResend()
    const trackingUrl = `${this.siteUrl}/quote-status/${quote.trackingToken}`

    const bodyHtml = `
      <p>Dear ${quote.name},</p>
      <p>Our team has sent you a new message regarding your <strong>${quote.service}</strong> project.</p>

      <p>Please visit your tracking page to view the message and reply:</p>
      <p><a href="${trackingUrl}" class="button">View Message</a></p>

      <p>If you have any questions in the meantime, please don't hesitate to reach out.</p>
      <p>Best regards,<br><strong>Contigo Constructions</strong></p>
    `

    await resend.emails.send({
      from: this.getFromAddress('Messages'),
      to: quote.email.toString(),
      subject: `New message about your ${quote.service} project`,
      html: this.renderEmailShell('You Have a New Message', bodyHtml),
    })
  }

  async sendStageChangeNotificationToClient(quote: Quote, stageLabel: string): Promise<void> {
    const resend = getResend()
    const trackingUrl = `${this.siteUrl}/quote-status/${quote.trackingToken}`

    const bodyHtml = `
      <p>Dear ${quote.name},</p>
      <p>Your <strong>${quote.service}</strong> project has moved to a new stage: <strong>${stageLabel}</strong>.</p>

      <p>You can check the full status of your project at any time:</p>
      <p><a href="${trackingUrl}" class="button">View Quote Status</a></p>

      <p>If you have any questions in the meantime, please don't hesitate to reach out.</p>
      <p>Best regards,<br><strong>Contigo Constructions</strong></p>
    `

    await resend.emails.send({
      from: this.getFromAddress('Updates'),
      to: quote.email.toString(),
      subject: `Your ${quote.service} project is now: ${stageLabel}`,
      html: this.renderEmailShell('Your Project Has Been Updated', bodyHtml),
    })
  }

  async sendStageChangeNotificationToAdmin(lead: Lead, quote: Quote, fromLabel: string, toLabel: string): Promise<void> {
    const resend = getResend()
    const adminEmail = process.env.ADMIN_EMAIL || 'contact@contigoconstructions.com.au'
    const leadUrl = `${this.siteUrl}/admin/leads/${lead.id}`

    const bodyHtml = `
      <div class="detail">
        <p><strong>Name:</strong> ${quote.name}</p>
      </div>
      <div class="detail">
        <p><strong>Service:</strong> ${quote.service}</p>
      </div>
      <div class="detail">
        <p><strong>Stage:</strong> ${fromLabel} &rarr; ${toLabel}</p>
      </div>

      <p><a href="${leadUrl}" class="button">View Lead</a></p>
    `

    await resend.emails.send({
      from: this.getFromAddress('Updates'),
      to: adminEmail,
      subject: `[Stage Change] ${quote.service} — ${quote.name}: ${fromLabel} → ${toLabel}`,
      html: this.renderEmailShell('Lead Stage Changed', bodyHtml),
    })
  }

  async sendEventScheduledNotificationToClient(quote: Quote, event: LeadEvent): Promise<void> {
    const resend = getResend()
    const trackingUrl = `${this.siteUrl}/quote-status/${quote.trackingToken}`
    const typeLabel = EVENT_TYPE_LABELS[event.type]
    const when = this.formatEventDateTime(event)

    const bodyHtml = `
      <p>Dear ${quote.name},</p>
      <p>We've scheduled a <strong>${typeLabel.toLowerCase()}</strong> for your <strong>${quote.service}</strong> project.</p>

      <ul>
        <li><strong>When:</strong> ${when}</li>
        <li><strong>Duration:</strong> ${event.durationMinutes} minutes</li>
        ${event.location ? `<li><strong>Location:</strong> ${event.location}</li>` : ''}
      </ul>

      <p>You can review your project status at any time:</p>
      <p><a href="${trackingUrl}" class="button">View Quote Status</a></p>

      <p>If you have any questions in the meantime, please don't hesitate to reach out.</p>
      <p>Best regards,<br><strong>Contigo Constructions</strong></p>
    `

    await resend.emails.send({
      from: this.getFromAddress('Scheduling'),
      to: quote.email.toString(),
      subject: `${typeLabel} scheduled for your ${quote.service} project`,
      html: this.renderEmailShell(`${typeLabel} Scheduled`, bodyHtml),
    })
  }

  async sendEventScheduledNotificationToAdmin(lead: Lead, quote: Quote, event: LeadEvent): Promise<void> {
    const resend = getResend()
    const adminEmail = process.env.ADMIN_EMAIL || 'contact@contigoconstructions.com.au'
    const leadUrl = `${this.siteUrl}/admin/leads/${lead.id}`
    const typeLabel = EVENT_TYPE_LABELS[event.type]
    const when = this.formatEventDateTime(event)

    const bodyHtml = `
      <div class="detail">
        <p><strong>Name:</strong> ${quote.name}</p>
      </div>
      <div class="detail">
        <p><strong>Service:</strong> ${quote.service}</p>
      </div>
      <div class="detail">
        <p><strong>When:</strong> ${when} (${event.durationMinutes} min)</p>
      </div>
      ${event.location ? `<div class="detail"><p><strong>Location:</strong> ${event.location}</p></div>` : ''}

      <p><a href="${leadUrl}" class="button">View Lead</a></p>
    `

    await resend.emails.send({
      from: this.getFromAddress('Scheduling'),
      to: adminEmail,
      subject: `[${typeLabel} Scheduled] ${quote.service} — ${quote.name}`,
      html: this.renderEmailShell(`${typeLabel} Scheduled`, bodyHtml),
    })
  }

  async sendEventUpdatedNotificationToClient(quote: Quote, event: LeadEvent): Promise<void> {
    const resend = getResend()
    const trackingUrl = `${this.siteUrl}/quote-status/${quote.trackingToken}`
    const typeLabel = EVENT_TYPE_LABELS[event.type]
    const when = this.formatEventDateTime(event)

    const bodyHtml = `
      <p>Dear ${quote.name},</p>
      <p>The <strong>${typeLabel.toLowerCase()}</strong> for your <strong>${quote.service}</strong> project has been updated.</p>

      <ul>
        <li><strong>New date/time:</strong> ${when}</li>
        <li><strong>Duration:</strong> ${event.durationMinutes} minutes</li>
        ${event.location ? `<li><strong>Location:</strong> ${event.location}</li>` : ''}
      </ul>

      <p>You can review your project status at any time:</p>
      <p><a href="${trackingUrl}" class="button">View Quote Status</a></p>

      <p>If you have any questions in the meantime, please don't hesitate to reach out.</p>
      <p>Best regards,<br><strong>Contigo Constructions</strong></p>
    `

    await resend.emails.send({
      from: this.getFromAddress('Scheduling'),
      to: quote.email.toString(),
      subject: `${typeLabel} updated for your ${quote.service} project`,
      html: this.renderEmailShell(`${typeLabel} Updated`, bodyHtml),
    })
  }

  async sendEventUpdatedNotificationToAdmin(lead: Lead, quote: Quote, event: LeadEvent): Promise<void> {
    const resend = getResend()
    const adminEmail = process.env.ADMIN_EMAIL || 'contact@contigoconstructions.com.au'
    const leadUrl = `${this.siteUrl}/admin/leads/${lead.id}`
    const typeLabel = EVENT_TYPE_LABELS[event.type]
    const when = this.formatEventDateTime(event)

    const bodyHtml = `
      <div class="detail">
        <p><strong>Name:</strong> ${quote.name}</p>
      </div>
      <div class="detail">
        <p><strong>Service:</strong> ${quote.service}</p>
      </div>
      <div class="detail">
        <p><strong>New date/time:</strong> ${when} (${event.durationMinutes} min)</p>
      </div>
      ${event.location ? `<div class="detail"><p><strong>Location:</strong> ${event.location}</p></div>` : ''}

      <p><a href="${leadUrl}" class="button">View Lead</a></p>
    `

    await resend.emails.send({
      from: this.getFromAddress('Scheduling'),
      to: adminEmail,
      subject: `[${typeLabel} Updated] ${quote.service} — ${quote.name}`,
      html: this.renderEmailShell(`${typeLabel} Updated`, bodyHtml),
    })
  }

  async sendEventCancelledNotificationToClient(quote: Quote, event: LeadEvent): Promise<void> {
    const resend = getResend()
    const trackingUrl = `${this.siteUrl}/quote-status/${quote.trackingToken}`
    const typeLabel = EVENT_TYPE_LABELS[event.type]
    const when = this.formatEventDateTime(event)

    const bodyHtml = `
      <p>Dear ${quote.name},</p>
      <p>The <strong>${typeLabel.toLowerCase()}</strong> previously scheduled for <strong>${when}</strong> regarding your <strong>${quote.service}</strong> project has been cancelled.</p>

      <p>If you'd like to reschedule, please check your project status page or get in touch with us directly:</p>
      <p><a href="${trackingUrl}" class="button">View Quote Status</a></p>

      <p>Best regards,<br><strong>Contigo Constructions</strong></p>
    `

    await resend.emails.send({
      from: this.getFromAddress('Scheduling'),
      to: quote.email.toString(),
      subject: `${typeLabel} cancelled for your ${quote.service} project`,
      html: this.renderEmailShell(`${typeLabel} Cancelled`, bodyHtml),
    })
  }

  async sendEventCancelledNotificationToAdmin(lead: Lead, quote: Quote, event: LeadEvent): Promise<void> {
    const resend = getResend()
    const adminEmail = process.env.ADMIN_EMAIL || 'contact@contigoconstructions.com.au'
    const leadUrl = `${this.siteUrl}/admin/leads/${lead.id}`
    const typeLabel = EVENT_TYPE_LABELS[event.type]
    const when = this.formatEventDateTime(event)

    const bodyHtml = `
      <div class="detail">
        <p><strong>Name:</strong> ${quote.name}</p>
      </div>
      <div class="detail">
        <p><strong>Service:</strong> ${quote.service}</p>
      </div>
      <div class="detail">
        <p><strong>Was scheduled for:</strong> ${when}</p>
      </div>

      <p><a href="${leadUrl}" class="button">View Lead</a></p>
    `

    await resend.emails.send({
      from: this.getFromAddress('Scheduling'),
      to: adminEmail,
      subject: `[${typeLabel} Cancelled] ${quote.service} — ${quote.name}`,
      html: this.renderEmailShell(`${typeLabel} Cancelled`, bodyHtml),
    })
  }

  // bodyHtml/subject arrive pre-rendered (merge fields already substituted
  // by DispatchReviewRequestsUseCase from the admin-editable template) —
  // this method only wraps them in the shared shell and sends.
  //
  // ⚠️ Compliance gap (plan §Phase 5, Spam Act 2003): renderEmailShell's
  // footer does not currently include an ABN. Flag to Gustavo — needs the
  // real business number before this goes to production sends.
  async sendReviewRequestEmail(params: { to: string; subject: string; bodyHtml: string }): Promise<void> {
    const resend = getResend()
    await resend.emails.send({
      from: this.getFromAddress('Reviews'),
      to: params.to,
      subject: params.subject,
      html: this.renderEmailShell(params.subject, params.bodyHtml),
    })
  }

  async sendReviewAutomationAlertToAdmin(params: { subject: string; bodyHtml: string }): Promise<void> {
    const resend = getResend()
    const adminEmail = process.env.ADMIN_EMAIL || 'contact@contigoconstructions.com.au'
    await resend.emails.send({
      from: this.getFromAddress('Reviews'),
      to: adminEmail,
      subject: params.subject,
      html: this.renderEmailShell(params.subject, params.bodyHtml),
    })
  }

  async sendPasswordResetEmail(params: { to: string; name: string; resetUrl: string }): Promise<void> {
    const resend = getResend()
    const bodyHtml = `
      <p>Hi ${params.name},</p>
      <p>We received a request to reset your admin password. Click the button below to choose a new one — this link expires in 30 minutes.</p>
      <p><a href="${params.resetUrl}" class="button">Reset Password</a></p>
      <p>If you didn't request this, you can safely ignore this email — your password will not be changed.</p>
    `
    await resend.emails.send({
      from: this.getFromAddress('Account'),
      to: params.to,
      subject: 'Reset your Contigo admin password',
      html: this.renderEmailShell('Password Reset Request', bodyHtml),
    })
  }

  async sendStaffInvitationEmail(params: { to: string; name: string; inviteUrl: string }): Promise<void> {
    const resend = getResend()
    const bodyHtml = `
      <p>Hi ${params.name},</p>
      <p>You've been invited to the Contigo Constructions admin panel. Click the button below to set your password and activate your account — this link expires in 72 hours.</p>
      <p><a href="${params.inviteUrl}" class="button">Accept Invitation</a></p>
      <p>If you weren't expecting this invitation, you can safely ignore this email.</p>
    `
    await resend.emails.send({
      from: this.getFromAddress('Account'),
      to: params.to,
      subject: "You're invited to the Contigo admin panel",
      html: this.renderEmailShell('Staff Invitation', bodyHtml),
    })
  }

  private formatEventDateTime(event: LeadEvent): string {
    return event.scheduledAt.toLocaleString('en-AU', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    })
  }
}
