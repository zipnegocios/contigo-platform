-- Migration: Hierarchical Category System
-- Adds parent_id, type, description, icon, order_index, is_active, updated_at to categories
-- Adds category_id FK to projects and services

-- 1. Drop UNIQUE constraints on name and slug
ALTER TABLE categories DROP CONSTRAINT IF EXISTS categories_name_unique;
ALTER TABLE categories DROP CONSTRAINT IF EXISTS categories_slug_unique;

-- 2. Add new columns to categories
ALTER TABLE categories
  ADD COLUMN IF NOT EXISTS parent_id uuid REFERENCES categories(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS type varchar(20) NOT NULL DEFAULT 'project',
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS icon varchar(100),
  ADD COLUMN IF NOT EXISTS order_index integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

-- 3. Compound unique index: slug unique per (type, parent_id)
CREATE UNIQUE INDEX IF NOT EXISTS idx_categories_slug_type_parent
  ON categories (slug, type, COALESCE(parent_id, '00000000-0000-0000-0000-000000000000'::uuid));

-- 4. Performance indexes
CREATE INDEX IF NOT EXISTS idx_categories_parent_id ON categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_categories_type ON categories(type);
CREATE INDEX IF NOT EXISTS idx_categories_order ON categories(order_index);

-- 5. Tag existing project categories as type='project'
UPDATE categories SET type = 'project'
  WHERE slug IN ('new-home','extension','renovation','commercial','restoration','uncategorized');

-- 6. Add category_id FK to projects
ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS category_id uuid REFERENCES categories(id) ON DELETE SET NULL;

-- 7. Backfill projects.category_id from string match
UPDATE projects p
  SET category_id = c.id
  FROM categories c
  WHERE lower(c.name) = lower(p.category)
    AND c.type = 'project';

CREATE INDEX IF NOT EXISTS idx_projects_category_id ON projects(category_id);

-- 8. Add category_id FK to services
ALTER TABLE services
  ADD COLUMN IF NOT EXISTS category_id uuid REFERENCES categories(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_services_category_id ON services(category_id);
