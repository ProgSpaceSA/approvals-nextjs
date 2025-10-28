# Approvals System

A production-ready approvals system built with Next.js, featuring role-based access control for CEO and Executive users. Executives create requests with multiple suggestions, and CEOs review and make decisions.

## 🧩 Project Idea (What and Why)

Organizations routinely need clear, auditable decisions on proposals (budgets, policies, purchases). Email threads and chat messages are hard to track and easy to lose. This project provides a focused approvals workflow where:

- Executives submit a request with 2–10 concrete suggestions/options.
- A CEO reviews the context and either chooses an option, writes a custom decision, or rejects the request.
- Every action is captured in an immutable audit trail for accountability and compliance.

The result is a transparent, structured, and fast decision-making process with role-based access, localization (AR/EN), and a modern, responsive UI.

## 🚀 Features

### Core Functionality
- **Two-Role System**: CEO (higher authority) and Executive (lower authority)
- **Request Management**: Executives create requests with 2-10 suggestions
- **Decision Making**: CEOs can choose suggestions, make custom decisions, or reject requests
- **Immutable Records**: Once processed or rejected, requests become read-only
- **Comprehensive Audit Trail**: All actions are logged with timestamps and metadata

### Technical Features
- **Type-Safe**: Full TypeScript implementation with strict mode
- **Real-time UI**: Optimistic updates and loading states
- **Responsive Design**: Modern UI with Tailwind CSS and shadcn/ui components
- **Secure Authentication**: NextAuth.js with credentials provider
- **Role-Based Access Control**: Middleware-enforced permissions
- **Database Integrity**: Prisma ORM with PostgreSQL and proper constraints
- **Input Validation**: Zod schemas on both client and server
- **Comprehensive Testing**: Unit tests for critical functionality
- **Production Ready**: Docker configuration, CI/CD pipeline, and error handling

## 🛠 Tech Stack

- **Framework**: Next.js 15+ (App Router, React Server Components)
- **Language**: TypeScript (strict mode)
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js (Auth.js) with RBAC
- **Validation**: Zod for input validation
- **UI**: Tailwind CSS + shadcn/ui components
- **Forms**: react-hook-form with zod resolver
- **Testing**: Vitest with comprehensive test coverage
- **Development**: ESLint, Prettier, Docker, GitHub Actions

## 📋 Prerequisites

- Node.js 18+ 
- PostgreSQL 15+ (or use Docker)
- npm or yarn package manager

## 🚀 Quick Start

### Option 1: Docker Setup (Recommended)

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd approvals-nextjs
   ```

2. **Copy environment variables**
   ```bash
   cp env.example .env
   ```

3. **Start with Docker Compose**
   ```bash
   npm run docker:up
   ```

4. **Run database migrations and seed**
   ```bash
   npm run prisma:migrate
   npm run seed
   ```

5. **Access the application**
   - Open http://localhost:3000
   - Use demo accounts (see below)

### Option 2: Local Development

1. **Clone and install dependencies**
   ```bash
   git clone <repository-url>
   cd approvals-nextjs
   npm install
   ```

2. **Setup PostgreSQL database**
   ```bash
   # Create database (adjust connection details as needed)
   createdb approvals_db
   ```

3. **Configure environment**
   ```bash
   cp env.example .env
   # Edit .env with your database URL and secrets
   ```

4. **Run database setup**
   ```bash
   npm run prisma:generate
   npm run prisma:migrate
   npm run seed
   ```

5. **Start development server**
   ```bash
   npm run dev
   ```

## 👥 Demo Accounts

The system comes with pre-seeded demo accounts:

### CEO Account
- **Email**: `ceo@example.com`
- **Password**: `Passw0rd!`
- **Access**: Dashboard to review all requests, make decisions

### Executive Account  
- **Email**: `exec@example.com`
- **Password**: `Passw0rd!`
- **Access**: Create requests, view own requests and decisions

## 🔄 User Flows

### Executive Workflow
1. **Sign In** → Redirected to "My Requests" page
2. **Create Request** → Click "New Request" button
3. **Add Details** → Enter title, description, and 2-10 suggestions
4. **Submit** → Request status becomes "PENDING"
5. **Track Progress** → View request status and CEO decisions

### CEO Workflow  
1. **Sign In** → Redirected to "Dashboard"
2. **Review Requests** → See all pending requests with filters/search
3. **Make Decision** → Choose from three options:
   - **Choose Suggestion** → Select one of the provided options
   - **Other Decision** → Enter custom decision text
   - **Reject Request** → Reject the entire request
4. **View Results** → Request becomes "PROCESSED" or "REJECTED"

## 🏗 Architecture

### Database Schema
```
User (CEO/EXECUTIVE roles)
├── Request (title, description, status)
│   ├── Suggestion[] (label, details)
│   └── AuditLog[] (action history)
```

### API Endpoints
- `POST /api/requests` - Create request (Executive only)
- `GET /api/requests` - List requests (role-based filtering)  
- `GET /api/requests/[id]` - Get request details
- `POST /api/requests/[id]/choose` - Choose suggestion (CEO only)
- `POST /api/requests/[id]/other` - Custom decision (CEO only)
- `POST /api/requests/[id]/reject` - Reject request (CEO only)
- `GET /api/audit` - Audit logs (role-based access)

### Key Components
- **Middleware**: Route protection and role-based access
- **API Routes**: RESTful endpoints with validation and RBAC
- **UI Components**: Reusable shadcn/ui components
- **Form Handling**: react-hook-form with optimistic updates
- **Database Layer**: Prisma with transactions and constraints

## 🧪 Testing

Run the test suite:
```bash
# Run all tests
npm test

# Run tests in watch mode  
npm run test:watch

# Run with coverage
npm test -- --coverage
```

Test coverage includes:
- API endpoint validation and RBAC
- Business logic and constraints
- Input validation schemas
- Database operations and transactions

## 🚀 Deployment

This guide covers production deployment using Yarn, Docker, and Vercel.

### 1) Environment Variables
Create `.env` from `env.example` and set the following:

```bash
DATABASE_URL="postgresql://user:pass@host:port/db"
NEXTAUTH_SECRET="your-production-secret"
NEXTAUTH_URL="https://your-domain.com"
NODE_ENV="production"
```

Notes:
- Set `NEXTAUTH_URL` to your public URL (e.g. `https://app.example.com`).
- Generate a strong `NEXTAUTH_SECRET` (e.g. `openssl rand -base64 32`).
- Ensure the database is reachable from your hosting environment.

### 2) Production Build & Run (Node.js server)

```bash
# Install deps
yarn install --frozen-lockfile

# Generate Prisma client
yarn prisma:generate

# Apply migrations
yarn prisma:deploy

# Build Next.js (standalone output is enabled in next.config.js)
yarn build

# Start server
yarn start
```

Optional: systemd service (Linux)

```ini
[Unit]
Description=Approvals Next.js
After=network.target

[Service]
Type=simple
WorkingDirectory=/var/www/approvals-nextjs
Environment=NODE_ENV=production
EnvironmentFile=/var/www/approvals-nextjs/.env
ExecStart=/usr/bin/yarn start
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

### 3) Docker Deployment

Build and run the standalone server image:

```bash
# Build image
docker build -t approvals-system .

# Run container
docker run --name approvals \
  --env-file .env \
  -p 3000:3000 \
  approvals-system
```

With Docker Compose (database + app):

```bash
# Start services in background
yarn docker:up

# Apply migrations inside the app container (first run)
docker exec -it $(docker ps -qf name=approvals) yarn prisma:deploy
```

### 4) Vercel Deployment

Vercel is well-suited for Next.js deployments:
- Connect your Git repository in Vercel.
- Set environment variables in the Vercel dashboard (`DATABASE_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`).
- Ensure your database allows connections from Vercel (or use a managed Postgres like Neon/Supabase/PlanetScale compatible).

Prisma on Vercel:
- Use `prisma migrate deploy` during build via a Vercel Build Step or CI step before deployment.
- Alternatively, run migrations from a CI/CD pipeline or a one-off script targeting the same database.

No extra configuration is required for Next.js 15 app router. This project already sets `output: 'standalone'`.

### 5) Health Checks

After deployment, verify:

```bash
# App responds
curl -I https://your-domain.com | head -n 1

# Sign-in route (localized)
curl -I https://your-domain.com/ar/sign-in | head -n 1
```

## 🔧 Development Scripts

```bash
# Development
npm run dev              # Start development server
npm run build           # Build for production
npm run start           # Start production server

# Database
npm run prisma:generate # Generate Prisma client
npm run prisma:migrate  # Run migrations
npm run prisma:studio   # Open Prisma Studio
npm run seed           # Seed database with demo data

# Code Quality
npm run lint           # Run ESLint
npm run type-check     # TypeScript type checking
npm run format         # Format with Prettier
npm run format:check   # Check formatting

# Testing
npm test              # Run tests
npm run test:watch    # Run tests in watch mode

# Docker
npm run docker:up     # Start Docker services
npm run docker:down   # Stop Docker services
```

## 📁 Project Structure

```
approvals-nextjs/
├── app/                    # Next.js App Router
│   ├── api/               # API route handlers
│   ├── dashboard/         # CEO dashboard
│   ├── my-requests/       # Executive requests page
│   ├── requests/[id]/     # Request detail page
│   └── sign-in/           # Authentication page
├── components/            # Reusable UI components
│   ├── ui/               # shadcn/ui components
│   ├── layout/           # Layout components
│   └── requests/         # Request-specific components
├── lib/                   # Utility libraries
│   ├── auth.ts           # Authentication logic
│   ├── db.ts             # Database connection
│   ├── utils.ts          # Helper functions
│   └── validations.ts    # Zod schemas
├── prisma/               # Database schema and migrations
│   ├── schema.prisma     # Database schema
│   └── seed.ts           # Database seeding
├── tests/                # Test files
├── types/                # TypeScript type definitions
└── middleware.ts         # Next.js middleware for auth
```

## 🔒 Security Features

- **Authentication**: Secure credential-based auth with bcrypt hashing
- **Authorization**: Role-based access control with middleware enforcement
- **Input Validation**: Server-side validation with Zod schemas
- **SQL Injection Prevention**: Prisma ORM with parameterized queries
- **CSRF Protection**: NextAuth.js built-in CSRF protection
- **Environment Security**: Sensitive data in environment variables
- **API Security**: Request validation and error handling

## 🐛 Troubleshooting

### Common Issues

**Database Connection Issues**
```bash
# Check database is running
docker ps

# Reset database
npm run docker:down
npm run docker:up
npm run prisma:migrate
```

**Build Errors**
```bash
# Clear Next.js cache
rm -rf .next

# Regenerate Prisma client
npm run prisma:generate

# Check TypeScript
npm run type-check
```

**Authentication Issues**
```bash
# Verify environment variables
cat .env

# Check NEXTAUTH_SECRET is set
# Ensure NEXTAUTH_URL matches your domain
```

## 📈 Performance Considerations

- **Database Indexing**: Composite indexes on status and timestamps
- **Pagination**: Built-in pagination for large datasets  
- **Optimistic Updates**: Immediate UI feedback for better UX
- **Caching**: Next.js automatic caching and optimization
- **Bundle Optimization**: Tree shaking and code splitting

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes and add tests
4. Run the test suite: `npm test`
5. Check code formatting: `npm run format:check`
6. Commit your changes: `git commit -m 'Add amazing feature'`
7. Push to the branch: `git push origin feature/amazing-feature`
8. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support, please:
1. Check the troubleshooting section above
2. Search existing GitHub issues
3. Create a new issue with detailed reproduction steps
4. Include relevant logs and environment information

---

**Built with ❤️ using Next.js, TypeScript, and modern web technologies.**
