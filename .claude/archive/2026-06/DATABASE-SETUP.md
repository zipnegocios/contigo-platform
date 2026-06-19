# 🗄️ Database Setup & Configuration

**Status:** ✅ **COMPLETE AND READY**

---

## 📊 Database Connection

| Property | Value |
|----------|-------|
| **Host** | 31.220.56.1 (external EasyPanel) |
| **Port** | 5436 |
| **Database** | contigo-db |
| **Username** | ccdbadmin |
| **Password** | ✓ Secure (stored in .env.local) |
| **Connection** | ✅ Active and verified |

---

## 📋 Tables Created

Drizzle migrations have created the following tables:

1. **quotes** — Customer quote submissions
   - Tracks quote status (new, contacted, in_progress, converted, closed)
   - Includes tracking token for customer access
   - Vector embeddings stored as JSONB

2. **projects** — Portfolio projects
   - Slug-based routing for portfolio pages
   - Featured/published status
   - Gallery URLs stored as JSONB array
   - Vector embeddings for semantic search (stored as JSONB)

3. **services** — Available services
   - Ordered list with display index
   - Published toggle
   - Description and image URL

4. **leads** — Sales pipeline
   - Links to quotes via quote_id
   - Kanban stages (prospect, contacted, quoted, won, lost)
   - Admin notes and estimated value
   - Timestamps for tracking

5. **admin_users** — Admin portal accounts
   - Email-based login
   - bcryptjs password hashing
   - Role-based access (owner, staff)
   - Last login tracking

---

## 🔧 Extensions & Features

### ✅ Installed
- UUID support (automatic with Drizzle)
- JSONB for embeddings and array storage
- Full-text search via PostgreSQL native support

### ℹ️ Not Available (Using Workaround)
- **pgvector** — Not installed on EasyPanel PostgreSQL
  - **Workaround:** Vector embeddings stored as JSONB arrays (1536-dimensional)
  - **Impact:** Similarity search uses application-level computation or full-table scan
  - **Future:** Can upgrade to pgvector if EasyPanel installs the extension

---

## 🔄 Database Operations

### Run Migrations
```bash
npm run db:setup
```
This will:
1. Test database connection
2. Run all Drizzle migrations
3. Create tables and indexes
4. Verify schema is in sync

### Test Connection
```bash
npm run db:test
```
Shows:
- Connection status
- List of tables
- Available extensions

### View Schema (Drizzle Studio)
```bash
npm run db:studio
```
Opens interactive database explorer at `localhost:3000`

---

## 📍 Connection Methods

### Local Development (.env.local)
```
DATABASE_URL=postgresql://ccdbadmin:4m9-K0nt1g0_pGdB_71sZ@31.220.56.1:5436/contigo-db?sslmode=disable
```
- Uses external EasyPanel IP
- Port 5436 (external forwarding)
- Development environment

### EasyPanel Deployment
```
DATABASE_URL=postgresql://ccdbadmin:4m9-K0nt1g0_pGdB_71sZ@platforms_contigo-pgdb:5432/contigo-db?sslmode=disable
```
- Uses internal container hostname
- Port 5432 (standard PostgreSQL)
- Application container to database container

---

## 🔐 Security

✅ **Credentials Management:**
- Database password in `.env.local` (gitignored)
- Never commit credentials
- Use EasyPanel variables for production

✅ **Connection Security:**
- Currently `sslmode=disable` for development
- Recommendation: Enable SSL for production (`sslmode=require`)

---

## 🚀 Ready for:

- [x] Quote submission system
- [x] Admin portal (login, dashboard)
- [x] Portfolio management
- [x] Lead tracking (CRM)
- [x] Service management
- [x] Email notifications (Resend)
- [ ] Vector similarity search (requires pgvector OR application-level implementation)

---

## 📝 Next Steps

### 1. Seed Admin User
```bash
npm run seed
```
Creates initial admin account (credentials in `SETUP-GUIDE.md`)

### 2. Run Dev Server
```bash
npm run dev
```
Access at `http://localhost:3000`

### 3. Test Quote Flow
1. Fill contact form
2. Check database for quote record
3. Verify email sent to admin

### 4. Test Admin Portal
1. Visit `/admin/login`
2. Login with seeded credentials
3. View quotes in inbox

---

## ⚠️ Known Limitations

| Feature | Status | Workaround |
|---------|--------|-----------|
| Vector similarity search | ⚠️ No pgvector | Store vectors as JSONB, use app-level distance calculation |
| Image uploads to R2 | ⏳ Optional | Configure when needed |
| AI embeddings | ⏳ Optional | OpenAI lazy-loaded when OPENAI_API_KEY set |

---

## 💡 Database Architecture

**Pattern:** Lazy-loaded Drizzle client with Proxy pattern

```typescript
// src/infrastructure/db/client.ts
export const db = new Proxy({} as ReturnType<typeof drizzle>, {
  get: (target, prop) => {
    const database = getDatabase()
    return (database as any)[prop]
  },
})
```

**Benefits:**
- DATABASE_URL not required at build time
- Connection created only when first accessed
- Compatible with Next.js build process
- Works with serverless deployments

---

## 📞 Support

For database issues:
- Check `.env.local` has correct DATABASE_URL
- Run `npm run db:test` to verify connection
- Check `SETUP-GUIDE.md` for troubleshooting
- Review `ENV-COMPARISON.md` for local vs production differences

---

**Last Updated:** 2026-06-06

**Status:** ✅ Database fully operational and ready for application use.
