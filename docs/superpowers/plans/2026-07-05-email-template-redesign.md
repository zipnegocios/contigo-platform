# Email template redesign — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the two inconsistent, logo-less email header/footer styles across all 12 `ResendEmailService` templates with one shared, branded header (petrol-800 + gold logo) and footer (petrol-800 + white icon-logo + automated-message disclaimer + contact info).

**Architecture:** A one-off script rasterizes the two brand SVGs into two colored PNGs (gold for header, white for footer) since the SVGs use `fill="currentColor"` (unusable via `<img>`) and Outlook desktop doesn't render SVG at all. `ResendEmailService` gains a private `renderEmailShell(title, bodyHtml)` method that owns the shared doctype/style/header/footer; all 12 send methods are rewritten to build only their body markup and delegate to it.

**Tech Stack:** Node.js script using `sharp` (already a dependency) for PNG rasterization; TypeScript changes confined to `ResendEmailService.ts`.

## Global Constraints

- No test framework exists in this repo — verify with `npx tsc --noEmit`, `npm run lint`, and `npm run build`, not unit tests.
- Do not run Chrome DevTools MCP browser tests, do not spawn subagents, do not `git commit` (suggest a commit message at the end instead) — same constraints as the prior task this session.
- No wording/subject-line/body-content changes to any of the 12 emails — only the shared shell changes.
- Footer address is `76 Coorara Avenue, Payneham South SA 5070` (confirmed correct) — the old `25 Green Avenue, Seaton SA 5023` variant is removed everywhere.
- Spec: `docs/superpowers/specs/2026-07-05-email-template-redesign-design.md`.

---

### Task 1: Generate the two colored logo PNGs

**Files:**
- Create: `scripts/generate-email-logos.mjs`
- Create (generated, not hand-written): `public/assets/logos/email/logo-main-gold.png`
- Create (generated, not hand-written): `public/assets/logos/email/logo-icon-white.png`

**Interfaces:**
- Produces: two static PNG files under `public/assets/logos/email/`, referenced by absolute URL in Task 2 as `${siteUrl}/assets/logos/email/logo-main-gold.png` and `${siteUrl}/assets/logos/email/logo-icon-white.png`.

- [ ] **Step 1: Write the script**

```js
import { readFileSync, mkdirSync } from 'fs'
import { fileURLToPath } from 'url'
import path from 'path'
import sharp from 'sharp'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')

const targets = [
  {
    src: path.join(root, 'public/assets/logos/logo-family_main-logo.svg'),
    out: path.join(root, 'public/assets/logos/email/logo-main-gold.png'),
    color: '#D4AF37',
    width: 400,
    height: 360,
  },
  {
    src: path.join(root, 'public/assets/logos/logo-family_icon-logo.svg'),
    out: path.join(root, 'public/assets/logos/email/logo-icon-white.png'),
    color: '#FFFFFF',
    width: 280,
    height: 194,
  },
]

mkdirSync(path.join(root, 'public/assets/logos/email'), { recursive: true })

for (const target of targets) {
  const svg = readFileSync(target.src, 'utf-8').replaceAll('fill="currentColor"', `fill="${target.color}"`)
  await sharp(Buffer.from(svg), { density: 300 })
    .resize(target.width, target.height)
    .png()
    .toFile(target.out)
  console.log(`Wrote ${target.out}`)
}
```

- [ ] **Step 2: Run it**

Run: `node scripts/generate-email-logos.mjs`
Expected output:
```
Wrote <root>/public/assets/logos/email/logo-main-gold.png
Wrote <root>/public/assets/logos/email/logo-icon-white.png
```

- [ ] **Step 3: Verify the files exist and are non-trivial in size**

Run (bash): `ls -la public/assets/logos/email/`
Expected: both `.png` files present, each at least a few KB (a 0-byte or missing file means the SVG read or sharp rasterization failed — check the `src` paths resolve correctly from `scripts/`).

---

### Task 2: Add `renderEmailShell` to `ResendEmailService`

**Files:**
- Modify: `src/infrastructure/services/ResendEmailService.ts`

**Interfaces:**
- Consumes: `this.siteUrl` (existing private field, already defined at the top of the class).
- Produces: `private renderEmailShell(title: string, bodyHtml: string): string` — later tasks call this instead of building their own full HTML document.

- [ ] **Step 1: Add the method**

Insert this method into the class, right after the existing `getFromAddress` method (after line 62, before `sendQuoteConfirmation`):

```ts
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
              <p>Need to get in touch? Email us at <a href="mailto:contact@contigoconstructions.com.au">contact@contigoconstructions.com.au</a> or WhatsApp us at <a href="https://wa.me/61406274096">+61 406 274 096</a>.</p>
              <p>76 Coorara Avenue, Payneham South SA 5070</p>
              <p>&copy; ${year} Contigo Constructions. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `
  }
```

- [ ] **Step 2: Verify**

Run: `npx tsc --noEmit`
Expected: no new errors (the method is unused so far — that's fine, it'll be wired up in Task 3).

---

### Task 3: Rewrite all 12 send methods to use `renderEmailShell`

**Files:**
- Modify: `src/infrastructure/services/ResendEmailService.ts`

**Interfaces:**
- Consumes: `this.renderEmailShell(title: string, bodyHtml: string): string` (Task 2).
- Produces: no new exports — internal restructuring only. Each method's `resend.emails.send({...})` call keeps its existing `from`/`to`/`subject` arguments unchanged; only `html` changes from the inline `htmlContent` template literal to `this.renderEmailShell(...)`.

This task replaces the entire body of each of the 12 methods. Since every method's
comment (`// EMAIL TEMPLATE — hardcoded colors...`) and full `htmlContent` template
literal must go, replace each method in full using the exact `old_string`/`new_string`
pairs below (apply one at a time, in order — line numbers will shift after each edit,
so match on content, not line numbers).

- [ ] **Step 1: `sendQuoteConfirmation`**

Old (full method body, from `const resend = getResend()` through the `resend.emails.send` call):

```ts
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
              <p>76 Coorara Avenue, Payneham South SA 5070 |+61 406 274 096</p>
            </div>
          </div>
        </body>
      </html>
    `

    await resend.emails.send({
      from: this.getFromAddress('Quotes'),
      to: quote.email.toString(),
      subject: 'Your Quote Request - Contigo Constructions',
      html: htmlContent,
    })
```

New:

```ts
    const resend = getResend()
    const trackingUrl = `${this.siteUrl}/quote-status/${quote.trackingToken}`

    const bodyHtml = `
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
    `

    await resend.emails.send({
      from: this.getFromAddress('Quotes'),
      to: quote.email.toString(),
      subject: 'Your Quote Request - Contigo Constructions',
      html: this.renderEmailShell('Thank You for Your Inquiry', bodyHtml),
    })
```

- [ ] **Step 2: `sendAdminNotification`**

Old:

```ts
    const resend = getResend()
    const adminEmail = process.env.ADMIN_EMAIL || 'contact@contigoconstructions.com.au'

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
      from: this.getFromAddress('New Quotes'),
      to: adminEmail,
      subject: `[New Quote] ${quote.service} - ${quote.name}`,
      html: htmlContent,
    })
```

New:

```ts
    const resend = getResend()
    const adminEmail = process.env.ADMIN_EMAIL || 'contact@contigoconstructions.com.au'

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
      <div class="detail">
        <p><strong>Message:</strong><br>${quote.message.replace(/\n/g, '<br>')}</p>
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
```

- [ ] **Step 3: `sendNewMessageNotificationToAdmin`**

Old:

```ts
    const resend = getResend()
    const adminEmail = process.env.ADMIN_EMAIL || 'contact@contigoconstructions.com.au'
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
      from: this.getFromAddress('Messages'),
      to: adminEmail,
      subject: `[New Message] ${quote.service} — ${quote.name}`,
      html: htmlContent,
    })
```

New:

```ts
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
```

- [ ] **Step 4: `sendNewMessageNotificationToClient`**

Old:

```ts
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
              <p>76 Coorara Avenue, Payneham South SA 5070|+61 406 274 096</p>
            </div>
          </div>
        </body>
      </html>
    `

    await resend.emails.send({
      from: this.getFromAddress('Messages'),
      to: quote.email.toString(),
      subject: `New message about your ${quote.service} project`,
      html: htmlContent,
    })
```

New:

```ts
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
```

- [ ] **Step 5: `sendStageChangeNotificationToClient`**

Old:

```ts
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
              <h1>Your Project Has Been Updated</h1>
            </div>
            <div class="body">
              <p>Dear ${quote.name},</p>
              <p>Your <strong>${quote.service}</strong> project has moved to a new stage: <strong>${stageLabel}</strong>.</p>

              <p>You can check the full status of your project at any time:</p>
              <p><a href="${trackingUrl}" class="button">View Quote Status</a></p>

              <p>If you have any questions in the meantime, please don't hesitate to reach out.</p>
              <p>Best regards,<br><strong>Contigo Constructions</strong></p>
            </div>
            <div class="footer">
              <p>&copy; 2025 Contigo Constructions. All rights reserved.</p>
              <p>76 Coorara Avenue, Payneham South SA 5070|+61 406 274 096</p>
            </div>
          </div>
        </body>
      </html>
    `

    await resend.emails.send({
      from: this.getFromAddress('Updates'),
      to: quote.email.toString(),
      subject: `Your ${quote.service} project is now: ${stageLabel}`,
      html: htmlContent,
    })
```

New:

```ts
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
```

- [ ] **Step 6: `sendStageChangeNotificationToAdmin`**

Old:

```ts
    const resend = getResend()
    const adminEmail = process.env.ADMIN_EMAIL || 'contact@contigoconstructions.com.au'
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
              <h1>Lead Stage Changed</h1>
            </div>
            <div class="body">
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
            </div>
          </div>
        </body>
      </html>
    `

    await resend.emails.send({
      from: this.getFromAddress('Updates'),
      to: adminEmail,
      subject: `[Stage Change] ${quote.service} — ${quote.name}: ${fromLabel} → ${toLabel}`,
      html: htmlContent,
    })
```

New:

```ts
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
```

- [ ] **Step 7: `sendEventScheduledNotificationToClient`**

Old:

```ts
    const resend = getResend()
    const trackingUrl = `${this.siteUrl}/quote-status/${quote.trackingToken}`
    const typeLabel = EVENT_TYPE_LABELS[event.type]
    const when = this.formatEventDateTime(event)

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
              <h1>${typeLabel} Scheduled</h1>
            </div>
            <div class="body">
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
            </div>
            <div class="footer">
              <p>&copy; 2025 Contigo Constructions. All rights reserved.</p>
              <p>76 Coorara Avenue, Payneham South SA 5070|+61 406 274 096</p>
            </div>
          </div>
        </body>
      </html>
    `

    await resend.emails.send({
      from: this.getFromAddress('Scheduling'),
      to: quote.email.toString(),
      subject: `${typeLabel} scheduled for your ${quote.service} project`,
      html: htmlContent,
    })
```

New:

```ts
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
```

- [ ] **Step 8: `sendEventScheduledNotificationToAdmin`**

Old:

```ts
    const resend = getResend()
    const adminEmail = process.env.ADMIN_EMAIL || 'contact@contigoconstructions.com.au'
    const leadUrl = `${this.siteUrl}/admin/leads/${lead.id}`
    const typeLabel = EVENT_TYPE_LABELS[event.type]
    const when = this.formatEventDateTime(event)

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
              <h1>${typeLabel} Scheduled</h1>
            </div>
            <div class="body">
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
            </div>
          </div>
        </body>
      </html>
    `

    await resend.emails.send({
      from: this.getFromAddress('Scheduling'),
      to: adminEmail,
      subject: `[${typeLabel} Scheduled] ${quote.service} — ${quote.name}`,
      html: htmlContent,
    })
```

New:

```ts
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
```

- [ ] **Step 9: `sendEventUpdatedNotificationToClient`**

Old:

```ts
    const resend = getResend()
    const trackingUrl = `${this.siteUrl}/quote-status/${quote.trackingToken}`
    const typeLabel = EVENT_TYPE_LABELS[event.type]
    const when = this.formatEventDateTime(event)

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
              <h1>${typeLabel} Updated</h1>
            </div>
            <div class="body">
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
            </div>
            <div class="footer">
              <p>&copy; 2025 Contigo Constructions. All rights reserved.</p>
              <p>76 Coorara Avenue, Payneham South SA 5070|+61 406 274 096</p>
            </div>
          </div>
        </body>
      </html>
    `

    await resend.emails.send({
      from: this.getFromAddress('Scheduling'),
      to: quote.email.toString(),
      subject: `${typeLabel} updated for your ${quote.service} project`,
      html: htmlContent,
    })
```

New:

```ts
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
```

- [ ] **Step 10: `sendEventUpdatedNotificationToAdmin`**

Old:

```ts
    const resend = getResend()
    const adminEmail = process.env.ADMIN_EMAIL || 'contact@contigoconstructions.com.au'
    const leadUrl = `${this.siteUrl}/admin/leads/${lead.id}`
    const typeLabel = EVENT_TYPE_LABELS[event.type]
    const when = this.formatEventDateTime(event)

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
              <h1>${typeLabel} Updated</h1>
            </div>
            <div class="body">
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
            </div>
          </div>
        </body>
      </html>
    `

    await resend.emails.send({
      from: this.getFromAddress('Scheduling'),
      to: adminEmail,
      subject: `[${typeLabel} Updated] ${quote.service} — ${quote.name}`,
      html: htmlContent,
    })
```

New:

```ts
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
```

- [ ] **Step 11: `sendEventCancelledNotificationToClient`**

Old:

```ts
    const resend = getResend()
    const trackingUrl = `${this.siteUrl}/quote-status/${quote.trackingToken}`
    const typeLabel = EVENT_TYPE_LABELS[event.type]
    const when = this.formatEventDateTime(event)

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
              <h1>${typeLabel} Cancelled</h1>
            </div>
            <div class="body">
              <p>Dear ${quote.name},</p>
              <p>The <strong>${typeLabel.toLowerCase()}</strong> previously scheduled for <strong>${when}</strong> regarding your <strong>${quote.service}</strong> project has been cancelled.</p>

              <p>If you'd like to reschedule, please check your project status page or get in touch with us directly:</p>
              <p><a href="${trackingUrl}" class="button">View Quote Status</a></p>

              <p>Best regards,<br><strong>Contigo Constructions</strong></p>
            </div>
            <div class="footer">
              <p>&copy; 2025 Contigo Constructions. All rights reserved.</p>
              <p>76 Coorara Avenue, Payneham South SA 5070|+61 406 274 096</p>
            </div>
          </div>
        </body>
      </html>
    `

    await resend.emails.send({
      from: this.getFromAddress('Scheduling'),
      to: quote.email.toString(),
      subject: `${typeLabel} cancelled for your ${quote.service} project`,
      html: htmlContent,
    })
```

New:

```ts
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
```

- [ ] **Step 12: `sendEventCancelledNotificationToAdmin`**

Old:

```ts
    const resend = getResend()
    const adminEmail = process.env.ADMIN_EMAIL || 'contact@contigoconstructions.com.au'
    const leadUrl = `${this.siteUrl}/admin/leads/${lead.id}`
    const typeLabel = EVENT_TYPE_LABELS[event.type]
    const when = this.formatEventDateTime(event)

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
              <h1>${typeLabel} Cancelled</h1>
            </div>
            <div class="body">
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
            </div>
          </div>
        </body>
      </html>
    `

    await resend.emails.send({
      from: this.getFromAddress('Scheduling'),
      to: adminEmail,
      subject: `[${typeLabel} Cancelled] ${quote.service} — ${quote.name}`,
      html: htmlContent,
    })
```

New:

```ts
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
```

- [ ] **Step 13: Verify no `htmlContent` variables remain and the class-level comment is still accurate**

Run (bash): `grep -n "htmlContent\|linear-gradient\|#1a1a1a\|#2a2a2a" src/infrastructure/services/ResendEmailService.ts`
Expected: no matches — every method now builds `bodyHtml` and calls `renderEmailShell`, and the old per-method dark/gradient header colors are gone (they only exist once now, inside `renderEmailShell`'s style block).

Update the file's top-of-file comment block (lines 1-19) to match the new single shared
palette instead of describing 3 different per-method header styles — replace:

```ts
 * Color Mapping:
 * - #D4AF37 → var(--gold-600) (header gradient, buttons)
 * - #C49A27 → gold-600 blend (header gradient end)
 * - #e0e0e0 → neutral border
 * - #fafaf8 → var(--neutral-50) (body background)
 * - #2a2a2a → footer dark bg
 * - #ccc → footer text (gray)
 * - #1a1a1a → admin header dark
```

with:

```ts
 * Color Mapping:
 * - #0D3C4C → var(--petrol-800) (shared header/footer background, renderEmailShell)
 * - #D4AF37 → var(--gold-600) (buttons, gold logo asset)
 * - #E2C063 → var(--gold-400) (footer links)
 * - #e0e0e0 → neutral border
 * - #fafaf8 → var(--neutral-50) (body background)
```

- [ ] **Step 14: Verify**

Run: `npx tsc --noEmit`
Expected: no new errors.

---

### Task 4: Full verification pass

**Files:** none (verification only)

- [ ] **Step 1: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors introduced by this feature.

- [ ] **Step 2: Lint the touched file**

Run: `npx eslint src/infrastructure/services/ResendEmailService.ts scripts/generate-email-logos.mjs`
Expected: no errors (pre-existing `no-explicit-any` style warnings elsewhere in the repo are out of scope; this file has none).

- [ ] **Step 3: Build**

Run: `npm run build`
Expected: build succeeds.

- [ ] **Step 4: Manual reasoning check (no browser/email-client testing available)**

Re-read the final `ResendEmailService.ts` top to bottom: confirm all 12 methods build a
`bodyHtml` string (no method still builds a full `htmlContent` document), confirm every
`resend.emails.send` call's `html` field is `this.renderEmailShell(<title>, bodyHtml)`
with a title matching the original `<h1>` text for that email, and confirm the
generated PNGs from Task 1 exist on disk at the exact paths `renderEmailShell`
references.

---

## Suggested commit message (do not run — user will commit manually)

```
feat: redesign email templates with branded petrol/gold header and footer
```
