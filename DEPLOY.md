# 🚀 Deployment Guide — Contigo Platform

## EasyPanel Deployment

### Prerequisites
- PostgreSQL 14+ with pgvector extension enabled
- Resend account (optional, for email)
- OpenAI API key (optional, for embeddings)
- Cloudflare R2 account (optional, for file storage)

### Step 1: Create Application in EasyPanel

1. Go to **EasyPanel Dashboard**
2. Click **+ New Application**
3. Select **Docker**
4. Connect your GitHub repository:
   - Repository: your-repo
   - Branch: main
5. Click **Next**

### Step 2: Configure Environment Variables

In EasyPanel > Application > Environment, add:

```
DATABASE_URL=postgresql://user:password@postgres-host:5432/contigo_db
NEXTAUTH_SECRET=<generate-random-32-char-secret>
NEXTAUTH_URL=https://your-domain.com
NODE_ENV=production
NEXT_PUBLIC_SITE_URL=https://your-domain.com
RESEND_API_KEY=re_xxxxx (optional)
OPENAI_API_KEY=sk-xxxxx (optional)
R2_ACCOUNT_ID=xxxxx (optional)
R2_ACCESS_KEY_ID=xxxxx (optional)
R2_SECRET_ACCESS_KEY=xxxxx (optional)
R2_BUCKET_NAME=xxxxx (optional)
R2_PUBLIC_URL=https://xxxxx (optional)
```

### Step 3: Configure Port & Health Check

1. **Port**: Set to `3000`
2. **Health Check Path**: `/` or `/api/health` (we'll add this)
3. **Restart Policy**: Always

### Step 4: Set Build Command

If EasyPanel doesn't auto-detect:
```
npm run build
```

### Step 5: Deploy

1. Click **Deploy**
2. EasyPanel will:
   - Clone your repo
   - Build the Docker image
   - Start the container
   - Run entrypoint.sh (which runs migrations + seed)

---

## What Happens on Startup

1. **Migrations**: `npm run db:push` creates tables
2. **Seed**: `npm run seed` creates default admin user
3. **Server Start**: `npm start` runs the Next.js production server

---

## First Admin Login

After deployment:

1. Visit: `https://your-domain.com/admin/login`
2. Email: `admin@contigo.com`
3. Password: `admin123`
4. **⚠️ IMPORTANT**: Change password immediately in `/admin/settings`

---

## Troubleshooting

### Database Connection Failed
- Check `DATABASE_URL` format in EasyPanel
- Ensure PostgreSQL has pgvector extension: `CREATE EXTENSION IF NOT EXISTS vector;`
- Test connection: `psql -d <DATABASE_URL>`

### Container Won't Start
- Check logs in EasyPanel
- Verify all required env vars are set
- Check Node.js version (must be 18+)

### Migrations Fail
- SSH into container: `docker exec -it <container> /bin/sh`
- Manual migration: `npm run db:push`
- Check schema at: `src/infrastructure/db/schema.ts`

### Seed User Not Created
- Check admin_users table: `SELECT * FROM admin_users;`
- Manually insert admin user (see `scripts/seed-admin.ts` for password hashing)

---

## Production Checklist

- [ ] Change default admin password
- [ ] Set NEXTAUTH_SECRET to random 32+ char string
- [ ] Configure RESEND_API_KEY for email
- [ ] Configure OPENAI_API_KEY for AI features
- [ ] Set up R2 for file uploads
- [ ] Configure custom domain in EasyPanel
- [ ] Enable HTTPS (EasyPanel handles this)
- [ ] Set up database backups

---

## Local Testing Before Deploy

```bash
# With docker-compose
docker-compose up

# Or with local postgres
export DATABASE_URL=postgresql://...
npm run db:push
npm run seed
npm run dev
```

Visit `http://localhost:3000/admin/login`
