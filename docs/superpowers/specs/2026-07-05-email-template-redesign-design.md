# Email template redesign — branded header/footer

## Problem

`ResendEmailService.ts` has 12 outbound email templates, each duplicating a full
`<!DOCTYPE html>`/`<style>`/header/footer block inline. Two inconsistent header styles
exist today (gold gradient for client-facing emails, solid `#1a1a1a` for admin-facing
ones) and only 6 of the 12 have a footer at all — none carry the Contigo Constructions
logo, and the footer address is inconsistent across templates (`76 Coorara Avenue,
Payneham South SA 5070` in some, `25 Green Avenue, Seaton SA 5023` in others). There's
no automated-message disclaimer or contact channel (email/WhatsApp) anywhere.

## Scope

In scope:
- Two new static PNG logo assets, generated once from the existing brand SVGs, colored
  for on-dark use (gold for the header, white for the footer).
- A shared private `renderEmailShell(title, bodyHtml)` method on `ResendEmailService`
  that owns the doctype, `<style>` block, header, and footer — replacing the per-method
  duplicated wrapper in all 12 methods. Each method keeps its existing body content
  (the `<div class="body">...</div>` innards) unchanged and passes it in.
- New unified header: solid `petrol-800` (`#0D3C4C`) background, centered gold logo,
  per-email title text below it in white (replacing both old header styles).
- New unified footer: solid `petrol-800` background, centered white icon-logo, an
  automated-message disclaimer, a contact line (email `mailto:` + WhatsApp `wa.me`
  click-to-chat link), the corrected postal address, and a copyright line with a
  dynamically computed year (today's hardcoded `2025` is already stale).
- Applies to all 12 send methods (both client-facing and admin-facing) uniformly.

Out of scope:
- No changes to any email's body content, subject line, or send-triggering logic.
- No `.vcf` attachment — the pasted vCard is only the source of the correct
  name/number for the WhatsApp link, per prior confirmation.
- No changes to `getFromAddress`/`getFromEmail` (sender display name), which was
  already reworked in a separate prior change.

## Logo assets

The two brand SVGs (`public/assets/logos/logo-family_main-logo.svg`,
`public/assets/logos/logo-family_icon-logo.svg`) use `fill="currentColor"`, which
resolves to black when referenced via `<img src="...svg">` (no inherited text color in
that context), and Outlook desktop doesn't render SVG in emails at all. A one-off script
(`scripts/generate-email-logos.mjs`, using `sharp` — already a dependency) does the
following at dev time, not at runtime:

1. Read each SVG's source text, replace `fill="currentColor"` with the target hex.
2. Rasterize via `sharp` to PNG at 2x the email-display size (for retina screens).
3. Write to `public/assets/logos/email/`:
   - `logo-main-gold.png` — `#D4AF37` (gold-600), source viewBox 1024×920 → exported
     400×360 (displayed at 200×180 in the email).
   - `logo-icon-white.png` — `#FFFFFF`, source viewBox 512×355.137 → exported
     280×194 (displayed at 140×97 in the email).

These are committed static files, referenced in emails via absolute URL
(`${this.siteUrl}/assets/logos/email/<file>.png`) since email clients can't resolve
relative paths.

## `renderEmailShell` — shared header/footer

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

Each of the 12 methods changes from building its own full `htmlContent` string to
building just the inner body markup, then calling
`this.renderEmailShell('<Title>', bodyHtml)`. The `.detail`/`.button` CSS classes used
by some methods (admin-facing ones use `.detail`, most use `.button`) now live once in
the shared `<style>` block shown above, instead of being repeated per method. Body
content strings (paragraphs, lists, links, buttons) are copied verbatim from the
current implementation — no wording changes.

## Rollout

Run `node scripts/generate-email-logos.mjs` once to produce the two PNGs, commit them.
Verify with `npx tsc --noEmit`, `npm run lint` (scoped to touched files), and
`npm run build`. No automated way to preview real HTML email rendering in this
environment (no browser testing per current session constraints) — the reasoning check
is re-reading the generated HTML string structure against this spec.
