# Contigo Platform

Luxury brand showcase website with admin dashboard, quote system, and portfolio management.

## 🚀 Quick Start

### Local Development

```bash
# Install dependencies
npm install

# Configure environment
cp .env.example .env.local
# Edit .env.local with your settings

# Run dev server
npm run dev
```

Visit `http://localhost:3000`

### Admin Portal

- URL: `/admin/login`
- Default email: `admin@contigo.com`
- Default password: `admin123`
- **⚠️ Change immediately after first login**

## 🐳 Docker & Deployment

### Local Docker (with PostgreSQL)

```bash
docker-compose up
```

### Production (EasyPanel)

See [DEPLOY.md](./DEPLOY.md) for detailed instructions.

## 📁 Project Structure

```
contigo-platform/
├── app/                          # Next.js 15 App Router
│   ├── (marketing)/              # Public pages
│   ├── admin/                    # Admin dashboard (protected)
│   ├── api/                      # API routes
│   ├── layout.tsx                # Root layout
│   └── globals.css               # Global styles
├── src/
│   ├── core/                     # Domain layer (entities, value objects)
│   ├── application/              # Use cases
│   ├── infrastructure/           # Databases, services, auth
│   └── presentation/             # React components, sections
├── scripts/                      # Utility scripts
├── public/                       # Static assets
├── Dockerfile                    # Production image
├── docker-compose.yml            # Local dev stack
└── DEPLOY.md                     # Deployment guide
```

## 🔑 Key Technologies

- **Next.js 15** - React framework with App Router
- **PostgreSQL + pgvector** - Database with semantic search
- **Drizzle ORM** - Type-safe database queries
- **NextAuth v5** - Authentication & authorization
- **React Hook Form + Zod** - Form validation
- **GSAP + ScrollTrigger** - Scroll animations
- **Tailwind CSS** - Styling
- **shadcn/ui** - Component library
- **Resend** - Transactional email
- **OpenAI** - Embeddings & AI features
- **Cloudflare R2** - File storage

## 📝 Available Scripts

```bash
# Development
npm run dev              # Start dev server (localhost:3000)
npm run build           # Production build
npm start               # Run production server
npm run lint            # ESLint

# Database
npm run db:push         # Push schema to database
npm run db:migrate      # Run migrations
npm run db:studio       # Drizzle Studio GUI
npm run seed            # Seed admin user

# Docker
docker-compose up       # Start full stack (postgres + app)
docker-compose down     # Stop all services
```

## 🔐 Environment Variables

Required:
- `DATABASE_URL` - PostgreSQL connection string
- `NEXTAUTH_SECRET` - Random 32+ char secret for JWT
- `NEXTAUTH_URL` - Full URL of your deployment

Optional:
- `RESEND_API_KEY` - For email notifications
- `OPENAI_API_KEY` - For AI embeddings
- `R2_*` - Cloudflare R2 for file uploads

See `.env.example` for complete list.

## 📚 Architecture

Contigo uses **Clean Architecture** principles:

1. **Domain Layer** (`src/core/`) - Business logic, entities, rules
2. **Application Layer** (`src/application/`) - Use cases, orchestration
3. **Infrastructure Layer** (`src/infrastructure/`) - Database, services, auth
4. **Presentation Layer** (`src/presentation/`) - React components, pages

## 🚢 Deployment

### EasyPanel (Recommended)

1. Create application
2. Set environment variables
3. Deploy from GitHub
4. Dockerfile handles migrations + seed automatically

See [DEPLOY.md](./DEPLOY.md) for step-by-step guide.

## 🐛 Troubleshooting

### Database Connection Failed
```bash
# Check PostgreSQL is running
psql -d $DATABASE_URL

# Ensure pgvector is installed
psql -d $DATABASE_URL -c "CREATE EXTENSION IF NOT EXISTS vector;"
```

### Admin Login Not Working
```bash
# Reseed admin user
npm run seed
```

### Build Fails
```bash
# Clean build cache
rm -rf .next
npm run build
```

## 📞 Support

For deployment issues, see [DEPLOY.md](./DEPLOY.md) troubleshooting section.

## 📄 License

Private project - Contigo Construction
