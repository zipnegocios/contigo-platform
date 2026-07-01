CREATE TABLE hero_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mode varchar(20) NOT NULL DEFAULT 'single',
  headline text NOT NULL DEFAULT '',
  subtitle text,
  eyebrow varchar(255),
  desktop_image_url text,
  mobile_image_url text,
  buttons jsonb NOT NULL DEFAULT '[]'::jsonb,
  slides jsonb NOT NULL DEFAULT '[]'::jsonb,
  autoplay_interval integer NOT NULL DEFAULT 5000,
  overlay_opacity integer NOT NULL DEFAULT 50,
  updated_at timestamp with time zone NOT NULL DEFAULT NOW()
);

INSERT INTO hero_config (mode, headline, subtitle, eyebrow, desktop_image_url, buttons, overlay_opacity)
VALUES (
  'single',
  'Building Dreams Together',
  'We don''t build for you, we build with you. Premium construction services tailored to your vision.',
  'Adelaide, South Australia',
  '/assets/hero-test1.png',
  '[
    {"id":"btn-1","label":"Our Services","style":"secondary","linkType":"scroll","href":"#services","scrollTarget":"services"},
    {"id":"btn-2","label":"Get a Quote","style":"primary","linkType":"scroll","href":"#contact","scrollTarget":"contact"}
  ]'::jsonb,
  50
);
