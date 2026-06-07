#!/bin/sh
set -e

# Only run initialization if DATABASE_URL is available
if [ -n "$DATABASE_URL" ]; then
  echo "🌱 Initializing database..."
  node scripts/seed-admin-prod.mjs || true
fi

echo "🚀 Starting Next.js server..."
npm start
