# Approvals System

A production-ready approvals system built with Next.js, featuring role-based access control for CEO and Executive users. Executives create requests with multiple suggestions, and CEOs review and make decisions.

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

### Environment Variables
```bash
DATABASE_URL="postgresql://user:pass@host:port/db"
NEXTAUTH_SECRET="your-production-secret"
NEXTAUTH_URL="https://your-domain.com"
NODE_ENV="production"
```

### Build and Deploy
```bash
# Build the application
npm run build

# Start production server
npm start
```

### Docker Production
```bash
# Build production image
docker build -t approvals-system .

# Run with environment variables
docker run -p 3000:3000 --env-file .env approvals-system
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
