# 🚀 Setup Guide — Contigo Platform

**Safe to commit:** This guide contains setup instructions WITHOUT real credentials.

For actual credentials, see `.env.example` (template) and local `.env.local` (ignored).

---

## 📋 Quick Setup Checklist

### **1. Local Development**

```bash
# Clone repository
git clone <repo-url>
cd contigo-platform

# Install dependencies
npm install

# Copy environment template
cp .env.example .env.local

# Edit with your local credentials
nano .env.local
# Fill in:
# - DATABASE_URL (EasyPanel external: 31.220.56.1:5436)
# - RESEND_API_KEY (from Resend dashboard)
# - OPENAI_API_KEY (optional, from OpenAI)
# - Other values

# Verify setup
node scripts/check-env.js

# Start dev server
npm run dev

# Access at http://localhost:3000
```

### **2. Production (EasyPanel)**

1. **Open EasyPanel Dashboard**
2. **Go to:** contigo-platform → Environment Variables
3. **Copy these variable names** (values from secure credential manager):
   - `DATABASE_URL` (use internal: `platforms_contigo-pgdb:5432`)
   - `NEXTAUTH_SECRET` (generate new with `openssl rand -base64 32`)
   - `NEXTAUTH_URL`
   - `RESEND_API_KEY`
   - `RESEND_FROM_EMAIL`
   - `NEXT_PUBLIC_SITE_URL`
   - `ADMIN_EMAIL`
   - `NODE_ENV=production`

4. **See detailed instructions in:**
   - `EASYPANEL-ENV-SETUP.md` (in `.gitignore`, local only)
   - `ENV-COMPARISON.md` (in `.gitignore`, local only)

---

## 🔐 Important: Credential Files

These files contain REAL credentials and are in `.gitignore` (never committed):

```
.env.local                    ← Your local development credentials
.env.production               ← Production credentials (use EasyPanel instead)
CREDENTIALS.md                ← Complete credential setup guide
DEPLOY.md                     ← Deployment instructions with credentials
EASYPANEL-ENV-SETUP.md       ← EasyPanel setup with examples
ENV-COMPARISON.md            ← .env.local vs EasyPanel comparison
```

**For team collaboration:**
- Store credentials in a password manager (1Password, Bitwarden, etc.)
- Do NOT share via Slack, email, or Git
- Each team member uses their own `.env.local`

---

## ✅ Verification

After setup, verify everything works:

```bash
# Check environment variables
node scripts/check-env.js

# Test build
npm run build

# Start dev server
npm run dev

# Open browser
# http://localhost:3000                    ← Marketing site
# http://localhost:3000/admin/login        ← Admin portal
```

---

## 📖 Further Reading

For complete setup details, see these LOCAL files (not committed to Git):
- `CREDENTIALS.md` — Credential management details
- `EASYPANEL-ENV-SETUP.md` — Step-by-step EasyPanel setup
- `ENV-COMPARISON.md` — Difference between local and production
- `DEPLOY.md` — Deployment checklist
- `SECURITY-POLICY.md` — Security best practices

---

## 🆘 Troubleshooting

### **Build fails: "DATABASE_URL is not defined"**
→ Verify `.env.local` exists and has `DATABASE_URL` set

### **Server won't start: Port 3000 already in use**
→ Kill existing process: `lsof -i :3000` then `kill -9 <PID>`

### **Connection to database fails**
→ Verify `DATABASE_URL` format:
  - Local: `postgresql://user:pass@31.220.56.1:5436/...`
  - EasyPanel: `postgresql://user:pass@platforms_contigo-pgdb:5432/...`

### **Email not sending from forms**
→ Verify `RESEND_API_KEY` is correct in `.env.local` or EasyPanel

---

## 🎯 What's Next?

After successful setup:

1. **Test the application:**
   - Visit marketing site
   - Submit a quote (test email)
   - Login to admin portal

2. **For production:**
   - Generate new `NEXTAUTH_SECRET`
   - Update EasyPanel environment variables
   - Test health endpoint

3. **Continue development:**
   - See `README.md` for project overview
   - See `SETUP-SUMMARY.md` for feature status
   - Start Fase 4 implementation (admin dashboard)

---

**Status: ✅ Ready to develop**

This repository is configured for secure credential management. All sensitive data is properly gitignored.
