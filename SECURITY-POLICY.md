# 🔐 Security Policy — Contigo Platform

## Credentials & Secrets Management

**IMPORTANT:** This document outlines the security practices for handling credentials and sensitive information in the Contigo Platform repository.

---

## 🚫 WHAT SHOULD NEVER BE COMMITTED

### **Environment Variables Files**
❌ **NEVER commit these files:**
```
.env              # Production environment
.env.local        # Local development environment
.env.*.local      # Environment-specific files
.env.production   # Production environment
.env.production.local
```

✅ **COMMIT ONLY:**
```
.env.example      # Template with instructions (NO real values)
```

### **Credential & Secret Files**
❌ **NEVER commit:**
```
credentials.json
credentials*.json
secrets.json
secrets*.json
.secrets
.credentials
*.pem
*.key
*.pfx
*.p12
private*.key
```

### **Other Sensitive Data**
❌ **NEVER commit:**
```
API keys (Resend, OpenAI, Cloudflare, etc.)
Database passwords
JWT secrets
OAuth tokens
SSH keys
SSL certificates
Private keys
Authentication tokens
```

---

## ✅ WHAT IS PROTECTED

### **Current `.gitignore` Coverage**

```gitignore
# Environment & Credentials
.env
.env.local
.env.*.local
.env.production
.env.production.local

# Credential & Sensitive Files
credentials.json
credentials*.json
secrets.json
secrets*.json
.secrets
.credentials
*.pem
*.key
*.pfx
*.p12
private*.key
```

### **Verification**

Run this to verify no credentials are tracked:

```bash
# Check git staging area
git status

# Check git history for any .env files
git log --all --full-history --oneline -- ".env*"

# Search for common credential patterns
git grep -i "password\|secret\|api_key\|token"
```

---

## 📋 CREDENTIALS MANAGEMENT

### **Local Development**

1. **Copy template:**
   ```bash
   cp .env.example .env.local
   ```

2. **Edit with real values:**
   ```bash
   # Edit .env.local with your credentials
   # This file is NEVER committed (in .gitignore)
   ```

3. **Verify .env.local is ignored:**
   ```bash
   git status  # Should NOT show .env.local
   ```

### **Production (EasyPanel)**

1. **Use EasyPanel Dashboard** for environment variables
2. **NEVER commit production secrets** to the repository
3. **Store credentials in EasyPanel**, not in code

### **Shared Team Credentials**

For **team collaboration**, use a **secure password manager:**
- 1Password
- Bitwarden
- LastPass
- KeePass
- Your organization's credential management system

**DO NOT share credentials via:**
- ❌ Slack messages
- ❌ Email
- ❌ Git commits
- ❌ GitHub issues
- ❌ Code comments

---

## 🔒 CURRENT CREDENTIALS STATUS

### **Safe (Not in Repository)**
✅ Database passwords
✅ API keys (Resend, OpenAI, Cloudflare)
✅ JWT secrets
✅ Admin passwords
✅ NEXTAUTH_SECRET

### **Safe (Public Template)**
✅ `.env.example` — Contains no real values, only instructions
✅ `CREDENTIALS.md` — Documentation (no real API keys shown)
✅ `DEPLOY.md` — Deployment instructions (no real values)

### **Never Committed**
✅ `.env.local` — in `.gitignore`
✅ `.env.production` — in `.gitignore`
✅ `credentials.json` — in `.gitignore`
✅ SSH keys — in `.gitignore`

---

## 🚨 IF CREDENTIALS ARE ACCIDENTALLY COMMITTED

### **Step 1: STOP — Don't push to remote**

If you notice credentials in a local commit BEFORE pushing:

```bash
# Check if it's already in git history
git log --all --full-history --oneline -- ".env.local"

# If it's in your latest commit (not yet pushed):
# Option A: Amend the commit (if not pushed)
git reset HEAD~1                    # Undo last commit
git reset -- .env.local            # Unstage the file
echo ".env.local" >> .gitignore    # Ensure it's ignored
git add .gitignore
git commit -m "fix: add .env.local to gitignore"

# Option B: Interactive rebase (if multiple commits ago)
git rebase -i HEAD~3               # Choose commits to edit
# Remove the commit that added credentials
```

### **Step 2: If already pushed to GitHub**

⚠️ **CRITICAL:** Credentials are now public!

1. **IMMEDIATELY rotate all exposed credentials:**
   - Regenerate API keys (Resend, OpenAI, Cloudflare, etc.)
   - Change database password
   - Generate new JWT secrets
   - Invalidate any leaked tokens

2. **Remove from git history:**
   ```bash
   # Use git-filter-branch or BFG
   bfg --delete-files .env.local .env.production
   git reflog expire --expire=now --all
   git gc --prune=now --aggressive
   git push --force-with-lease
   ```

3. **Document the incident:**
   - Create an internal security incident report
   - Notify team members
   - Update credentials audit log

### **Step 3: Prevent future incidents**

Add to git pre-commit hook:

```bash
# .git/hooks/pre-commit (make executable: chmod +x)
#!/bin/bash

# Prevent committing .env files
if git diff --cached --name-only | grep -E "\.env" | grep -v "\.env\.example"; then
    echo "ERROR: Attempting to commit .env file with real credentials!"
    echo "Use .env.local or configure in EasyPanel instead."
    exit 1
fi

# Prevent committing files with "password", "secret", "api_key"
if git diff --cached | grep -i "password\|secret\|api_key" | grep -v "\.env\.example"; then
    echo "ERROR: Attempting to commit file containing credentials!"
    exit 1
fi

exit 0
```

---

## 📊 CREDENTIAL AUDIT CHECKLIST

- [ ] `.env.local` is in `.gitignore`
- [ ] `.env.production` is in `.gitignore`
- [ ] `credentials*.json` is in `.gitignore`
- [ ] `*.key` and `*.pem` files are in `.gitignore`
- [ ] `.env.example` contains NO real API keys
- [ ] All API keys are in EasyPanel environment variables only
- [ ] Database password is NOT hardcoded anywhere
- [ ] JWT secrets are generated and unique per environment
- [ ] No credentials in comments or documentation
- [ ] No credentials in git history: `git log --all -S "api_key\|password" --oneline` returns nothing

---

## 🔄 ROTATING CREDENTIALS

### **When to Rotate**

- [ ] After accidental public exposure
- [ ] Quarterly (security best practice)
- [ ] When team member leaves
- [ ] After security incident
- [ ] Before major release

### **How to Rotate**

1. **Generate new credential** (e.g., new API key from Resend)
2. **Update in EasyPanel** environment variables
3. **Test in staging** before production
4. **Keep old credential** for 24h (for any pending requests)
5. **Revoke old credential** after 24h

---

## 📞 SECURITY CONTACTS

**For security issues:**
- Report internally to: `admin@contigoconstructions.com.au`
- Do NOT create public GitHub issues
- Do NOT post in Slack channels
- Do NOT email to multiple people

**Incident Response:**
- Immediately rotate exposed credentials
- Notify EasyPanel support if needed
- Document in internal security log
- Review git history for other exposures

---

## 🚀 DEPLOYMENT SECURITY

### **Local Development**
✅ `.env.local` with real credentials (in `.gitignore`)

### **Staging Environment**
✅ Use EasyPanel environment variables
✅ Different credentials than production
✅ Can test with limited access

### **Production Environment**
✅ Use EasyPanel environment variables
✅ High-privilege credentials in secure vault
✅ Regular credential rotation
✅ Access logs monitored
✅ Principle of least privilege

---

## 📝 GIT BEST PRACTICES

### **Before committing:**

```bash
# Check for credentials in staged files
git diff --cached | grep -i "password\|secret\|api_key"

# Verify no .env files will be committed
git status

# Review each file being committed
git diff --cached --name-only
```

### **Git configuration:**

```bash
# Prevent accidental commits by setting a safety check
git config --global core.safecrlf true
```

---

## ✅ FINAL CHECKLIST

- [x] `.gitignore` includes all credential file patterns
- [x] `.env.local` is in `.gitignore`
- [x] `.env.example` has no real values
- [x] `CREDENTIALS.md` and `DEPLOY.md` have no real API keys shown
- [x] No hardcoded secrets in source code
- [x] EasyPanel environment variables used for production
- [x] Team uses password manager for shared credentials

---

**Status: ✅ SECURE**

This repository follows security best practices for credential management.
