-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Create custom types for enums
CREATE TYPE quote_status AS ENUM ('new', 'contacted', 'in_progress', 'converted', 'closed');
CREATE TYPE project_status AS ENUM ('draft', 'published', 'archived');
CREATE TYPE lead_stage AS ENUM ('prospect', 'contacted', 'quoted', 'won', 'lost');
CREATE TYPE admin_role AS ENUM ('owner', 'staff');

-- Create quotes table
CREATE TABLE IF NOT EXISTS quotes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name varchar(255) NOT NULL,
  email varchar(255) NOT NULL,
  phone varchar(20),
  service varchar(255) NOT NULL,
  message text NOT NULL,
  status quote_status NOT NULL DEFAULT 'new',
  tracking_token varchar(255) NOT NULL UNIQUE,
  description_vector vector(1536),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX idx_quotes_status ON quotes(status);
CREATE INDEX idx_quotes_email ON quotes(email);
CREATE INDEX idx_quotes_tracking_token ON quotes(tracking_token);
CREATE INDEX idx_quotes_created_at ON quotes(created_at);
CREATE INDEX idx_quotes_vector_hnsw ON quotes USING hnsw (description_vector vector_cosine_ops);

-- Create projects table
CREATE TABLE IF NOT EXISTS projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug varchar(255) NOT NULL UNIQUE,
  title varchar(255) NOT NULL,
  category varchar(255) NOT NULL,
  description text NOT NULL,
  location varchar(255) NOT NULL,
  completed_date timestamp with time zone NOT NULL,
  featured boolean NOT NULL DEFAULT false,
  published boolean NOT NULL DEFAULT false,
  cover_image_url text NOT NULL,
  gallery_urls jsonb NOT NULL DEFAULT '[]'::jsonb,
  description_vector vector(1536),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX idx_projects_slug ON projects(slug);
CREATE INDEX idx_projects_status ON projects(published);
CREATE INDEX idx_projects_featured ON projects(featured);
CREATE INDEX idx_projects_created_at ON projects(created_at);
CREATE INDEX idx_projects_vector_hnsw ON projects USING hnsw (description_vector vector_cosine_ops);

-- Create services table
CREATE TABLE IF NOT EXISTS services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug varchar(255) NOT NULL UNIQUE,
  name varchar(255) NOT NULL,
  short_description text NOT NULL,
  full_description text NOT NULL,
  image_url text NOT NULL,
  order_index integer NOT NULL DEFAULT 0,
  published boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX idx_services_order ON services(order_index);

-- Create admin_users table
CREATE TABLE IF NOT EXISTS admin_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email varchar(255) NOT NULL UNIQUE,
  password_hash text NOT NULL,
  name varchar(255) NOT NULL,
  role admin_role NOT NULL DEFAULT 'staff',
  is_active boolean NOT NULL DEFAULT true,
  last_login timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create leads table (references quotes)
CREATE TABLE IF NOT EXISTS leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id uuid NOT NULL REFERENCES quotes(id) ON DELETE CASCADE,
  stage lead_stage NOT NULL DEFAULT 'prospect',
  admin_notes text,
  estimated_value integer,
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX idx_leads_stage ON leads(stage);
CREATE INDEX idx_leads_quote_id ON leads(quote_id);
