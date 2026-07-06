export default function AboutAuthoritySection() {
  return (
    <section
      style={{
        backgroundColor: 'var(--neutral-50)',
        padding: 'var(--spacing-16) var(--spacing-6)',
        margin: 'var(--spacing-12) 0',
      }}
    >
      <div
        style={{
          maxWidth: '56rem',
          margin: '0 auto',
          padding: '0 var(--spacing-4)',
        }}
      >
        <h2
          style={{
            fontSize: 'var(--text-fluid-lg)',
            fontFamily: 'var(--font-cormorant)',
            fontWeight: 600,
            marginBottom: 'var(--spacing-4)',
            color: 'var(--neutral-900)',
          }}
        >
          About Contigo Constructions
        </h2>

        <p
          style={{
            fontSize: 'var(--text-fluid-base)',
            lineHeight: 1.8,
            color: 'var(--neutral-700)',
            marginBottom: 'var(--spacing-4)',
          }}
        >
          Contigo Constructions Pty Ltd has operated since May 2026, building on more than 5 years of professional
          experience previously established under D'Osorio Carpentry. We are a licensed Carpentry & Joinery contractor
          (BLD Licence 357596, Master Builders South Australia member) in Adelaide, specialising in renovations, home
          extensions, pergolas, decking, framing, cladding, and custom carpentry.
        </p>

        <p
          style={{
            fontSize: 'var(--text-fluid-base)',
            lineHeight: 1.8,
            color: 'var(--neutral-700)',
            marginBottom: 'var(--spacing-4)',
          }}
        >
          We combine licensed expertise, exceptional craftsmanship and honest communication with a genuinely personalised
          approach. Every successful project is built together — we work closely with every client, providing reliable
          service, attention to detail and high-quality workmanship that delivers lasting results.
        </p>

        <p
          style={{
            fontSize: 'var(--text-fluid-base)',
            lineHeight: 1.8,
            color: 'var(--neutral-700)',
            marginBottom: 'var(--spacing-4)',
          }}
        >
          We do not undertake new home construction, large-scale commercial or industrial developments, or work outside
          the scope of our licensed Carpentry & Joinery services. Where additional licensed trades are required, we
          coordinate them as part of a complete project.
        </p>

        <p
          style={{
            fontSize: 'var(--text-fluid-base)',
            lineHeight: 1.8,
            color: 'var(--neutral-700)',
          }}
        >
          Serving Adelaide CBD and surrounding metropolitan suburbs within a 20 km radius, including the Eastern
          Suburbs, Inner East, Inner North, Inner South, Inner West, North Eastern Suburbs, and Adelaide Hills foothills.
          ABN: 25 698 028 394.
        </p>
      </div>
    </section>
  )
}
