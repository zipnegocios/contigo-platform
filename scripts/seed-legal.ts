/**
 * Seeds the 6 compliance/legal documents as v1 drafts (status='draft').
 * Idempotent: skips any slug that already has a row in legal_documents.
 *
 * Content follows the plan's §6 outlines. Two headings are worded to match
 * the anchor ids registered in legal-requirements.ts exactly (rehype-slug
 * derives ids from heading text): "Data Deletion" -> #data-deletion,
 * "Third-Party Services" -> #third-party-services,
 * "Third-Party Content and Services" -> #third-party-content-and-services
 * ("and" spelled out, not "&", since "&" is stripped by the slugger).
 *
 * Registered address is a placeholder pending client confirmation
 * (changelog #8) — must be resolved before Fase 5 sends this to legal review.
 *
 * Usage: npx tsx scripts/seed-legal.ts
 */
import 'dotenv/config'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { eq } from 'drizzle-orm'
import * as schema from '../src/infrastructure/db/schema'

const client = postgres(process.env.DATABASE_URL!, { max: 1 })
const db = drizzle(client, { schema })

const ADDRESS_PLACEHOLDER = '[REGISTERED ADDRESS — TO CONFIRM]'
const ENTITY = 'Contigo Constructions Pty Ltd (ABN 25 698 028 394), trading as Contigo Constructions'
const LICENCE = 'Building Work Contractor Licence BLD 357596 (Carpentry and Joinery)'

const documents: Array<{
  slug: string
  domain: 'website' | 'service' | 'general'
  title: string
  content: string
}> = [
  {
    slug: 'website-terms',
    domain: 'website',
    title: 'Website Terms of Use',
    content: `These terms govern your use of this website. They do not cover the construction services ${ENTITY} provides — for those, see the Service & Quotation Terms.

## About These Terms

This website is operated by ${ENTITY}, registered office at ${ADDRESS_PLACEHOLDER}. By using this website you agree to these terms.

## Use of the Website

You may browse this website, request a quote, and use the client tracking portal for the purpose of engaging with our construction services.

## Acceptable Use

You must not use this website to send spam, scrape content at scale, attempt unauthorised access, interfere with its operation, or reverse engineer any part of it.

## Intellectual Property

All text, photographs, project imagery, logos, and code on this website belong to ${ENTITY} or are used under licence. You may not reproduce or redistribute this content without written permission.

## Third-Party Content and Services

This website may use reputable third-party technology providers to operate certain features. Where a provider's own terms require it, those terms are incorporated by reference here.

## Availability and Changes

We may update, suspend, or change this website at any time without notice. We do not guarantee uninterrupted availability.

## Links to Other Websites

This website may link to third-party websites. We are not responsible for their content or practices.

## Governing Law

These terms are governed by the laws of South Australia.

## Contact

Questions about these terms can be sent through the contact form on this website.`,
  },
  {
    slug: 'privacy-policy',
    domain: 'website',
    title: 'Privacy Policy',
    content: `This policy explains how ${ENTITY} collects, uses, and protects personal information.

## Who We Are

${ENTITY}, registered office at ${ADDRESS_PLACEHOLDER}, is the entity responsible for the personal information described in this policy.

## What We Collect

We collect information you provide through quote request forms, file uploads, the client tracking portal, and messages exchanged with our team.

## Why We Collect It

We use this information to prepare quotes, deliver construction services, communicate about your project, and meet our legal obligations.

## Storage and Security

We use industry-standard security measures to protect the information we hold.

## Third-Party Services

We rely on reputable technology providers, some located overseas, to operate parts of this website and our internal systems.

## Overseas Disclosure

Some of the providers we use, including in the United States, may store or process personal information outside Australia.

## Marketing Emails

We only send marketing communications with your consent, and every message includes an unsubscribe option, in line with the Spam Act 2003.

## Cookies

See our Cookie Policy for details on the cookies this website uses.

## Project Imagery and Your Privacy

We never publish property addresses or personal details of homeowners alongside project photography.

## Data Deletion

You can request access to, correction of, or deletion of your personal information by emailing us. We aim to respond within 30 days.

## Data Breaches

We follow the Notifiable Data Breaches scheme and will notify affected individuals and the OAIC where required.

## Future Integrations

As we adopt new integrations (for example, Google or Meta platforms), this policy will be updated to reflect any additional data practices.

## Complaints

If you are not satisfied with how we have handled your personal information, you may lodge a complaint with the Office of the Australian Information Commissioner (OAIC).

## Contact

Privacy questions can be sent through the contact form on this website.`,
  },
  {
    slug: 'cookie-policy',
    domain: 'website',
    title: 'Cookie Policy',
    content: `This policy explains how this website uses cookies.

## Essential Cookies

We use essential cookies to maintain admin sessions and to track quote status through the client portal. These cannot be disabled without breaking core functionality.

## Preference Cookies

We may use cookies to remember display preferences you set on this website.

## Analytics

We do not currently use analytics cookies. This section will be updated if that changes.

## Future Third-Party Cookies

If we integrate third-party platforms such as Google in the future, this policy will list any cookies they set.

## Managing Cookies in Your Browser

You can manage or delete cookies through your browser settings at any time.`,
  },
  {
    slug: 'accessibility',
    domain: 'website',
    title: 'Accessibility Statement',
    content: `${ENTITY} is committed to making this website usable by as many people as possible.

## Our Commitment

We aim to meet WCAG 2.1 Level AA guidelines across this website.

## Measures We Have Taken

We have reviewed this website's structure, contrast, and keyboard navigation against WCAG 2.1 AA criteria.

## Known Limitations

Some scroll-driven animations on this website are decorative; we honour the \`prefers-reduced-motion\` setting where implemented.

## Reporting an Issue

If you encounter an accessibility barrier on this website, please contact us through the contact form so we can address it.

## Review

This statement is reviewed annually.`,
  },
  {
    slug: 'service-terms',
    domain: 'service',
    title: 'Service & Quotation Terms',
    content: `These terms govern the construction services ${ENTITY} provides, separately from your use of this website (see Website Terms of Use).

## Who Provides the Services

Services are provided by ${ENTITY} under ${LICENCE}. Where a project requires trade work outside these licence conditions, that work is delivered in coordination with appropriately licensed trade professionals.

## Scope of Services

Our services are anchored to our licence conditions and the service categories listed on this website.

## Quotations

Quotes are estimates only, valid for 14 days from the date issued, and subject to site inspection. A quote is not a binding offer until confirmed in a signed contract.

## Engagement

Every project is confirmed through a separate written contract. Where applicable, the Building Work Contractors Act 1995 (SA) governs our engagement.

## Warranties

Warranties are set out in the signed contract for each project and are governed by South Australian legislation.

## Consumer Guarantees

Nothing in these terms excludes, restricts, or modifies any consumer guarantee under the Australian Consumer Law.

## Project Imagery and Marketing

Project photographs are only published with client authorisation. Where a signed contract permits it, we may use project imagery for marketing, our portfolio, this website, and social media.

## Liability

Our liability is limited to the extent permitted by law and is always subordinate to the Australian Consumer Law.

## Contact

Questions about a quote or an active project can be sent through the client tracking portal or the contact form on this website.`,
  },
  {
    slug: 'disclaimer',
    domain: 'general',
    title: 'Disclaimer',
    content: `## General Information

The information on this website is general in nature and provided by ${ENTITY} for informational purposes.

## Errors and Omissions

While we take care to keep this website accurate, we do not guarantee it is free of errors or omissions.

## Representative Images

Project images on this website are representative of past work and may not reflect the exact outcome of a future project.

## External Links

This website may link to external websites. We are not responsible for their content.

## Consumer Law

Nothing in this disclaimer excludes, restricts, or modifies any consumer guarantee under the Australian Consumer Law.`,
  },
]

async function main() {
  let created = 0
  let skipped = 0

  for (const doc of documents) {
    const existing = await db
      .select({ id: schema.legalDocuments.id })
      .from(schema.legalDocuments)
      .where(eq(schema.legalDocuments.slug, doc.slug))
      .limit(1)

    if (existing.length > 0) {
      console.log(`Skip (already exists): ${doc.slug}`)
      skipped++
      continue
    }

    await db.insert(schema.legalDocuments).values({
      slug: doc.slug,
      domain: doc.domain,
      title: doc.title,
      content: doc.content,
      version: 1,
      status: 'draft',
    })
    console.log(`Created draft: ${doc.slug}`)
    created++
  }

  console.log(`\nDone. Created: ${created}, Skipped: ${skipped}`)
  await client.end()
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
