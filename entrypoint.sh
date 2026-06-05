#!/bin/sh
set -e

echo "🗄️  Running database migrations..."
npm run db:push || true

echo "🌱 Seeding admin user..."
npm run seed || true

echo "🚀 Starting Next.js server..."
npm start
