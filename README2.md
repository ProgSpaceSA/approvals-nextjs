# Approvals Next.js - Production Deployment Guide

**Complete project documentation with production setup details**

---

## 📋 Table of Contents

1. [Project Overview](#project-overview)
2. [Production Environment](#production-environment)
3. [User Credentials](#user-credentials)
4. [Infrastructure Setup](#infrastructure-setup)
5. [Service Configuration](#service-configuration)
6. [Nginx Configuration](#nginx-configuration)
7. [SSL/HTTPS Setup](#sslhttps-setup)
8. [Database Configuration](#database-configuration)
9. [Application Structure](#application-structure)
10. [Development Workflow](#development-workflow)
11. [Troubleshooting](#troubleshooting)

---

## 🎯 Project Overview

**Application Name**: إنهج / Inhaj  
**Production URL**: https://inhaj.com  
**Framework**: Next.js 15.5.5 with App Router  
**Language**: TypeScript (strict mode)  
**Database**: PostgreSQL 15 (Docker container)  
**Authentication**: NextAuth.js v4.24.7  
**Internationalization**: next-intl (Arabic RTL default, English LTR)

### Core Features

- **Two-Role System**: CEO (approvals) and Executives (request creators)
- **Request Management**: Create requests with 2-10 suggestions per request
- **Decision Workflow**: CEOs choose suggestions, make custom decisions, or reject
- **Audit Trail**: Complete immutable logging of all actions
- **Modern UI**: Tailwind CSS + shadcn/ui with responsive design
- **RTL Support**: Right-to-left layout for Arabic (default), LTR for English

---

## 🌐 Production Environment

### Server Details

- **OS**: Linux 6.14.0-23-generic
- **Working Directory**: `/home/approvals-nextjs`
- **Node.js**: v20+ (via systemd service)
- **Database**: PostgreSQL 15 Alpine (Docker container)

### Environment Variables

Location: `/home/approvals-nextjs/.env`

```bash
# PostgreSQL Configuration
POSTGRES_USER=approvals
POSTGRES_PASSWORD=Qb4nYtL2uE7Xc9PzR1VfW3jK6mH8sA0D
POSTGRES_DB=approvals
DATABASE_URL=postgresql://approvals:Qb4nYtL2uE7Xc9PzR1VfW3jK6mH8sA0D@postgres:5432/approvals?schema=public

# NextAuth Configuration
NEXTAUTH_SECRET=Q1wE2rT3yU4iO5pA6sD7fG8hJ9kL0zXc
NEXTAUTH_URL=https://inhaj.com

# Application Configuration
NODE_ENV=production
NEXT_PUBLIC_SITE_URL=https://inhaj.com
APP_URL=https://inhaj.com
```

**⚠️ Security Note**: These credentials are for production. Rotate passwords regularly and never commit `.env` to version control.

---

## 👥 User Credentials

### CEO Account
- **Email**: `ceo@inhaj.com`
- **Password**: Unique 8-character password (generated during seeding)
- **Role**: CEO
- **Access**: Full dashboard, all requests, decision-making capabilities

### Executive Accounts

1. **Ali Executive**
   - **Email**: `ali@inhaj.com`
   - **Password**: Unique 8-character password
   - **Role**: EXECUTIVE

2. **Khabbab Executive**
   - **Email**: `khabbab@inhaj.com`
   - **Password**: Unique 8-character password
   - **Role**: EXECUTIVE

3. **Mohsenand Executive**
   - **Email**: `mohsenand@inhaj.com`
   - **Password**: Unique 8-character password
   - **Role**: EXECUTIVE

4. **Majid Executive**
   - **Email**: `majid@inhaj.com`
   - **Password**: Unique 8-character password
   - **Role**: EXECUTIVE

**Password Retrieval**: Passwords are generated during database seeding and printed to console. See `scripts/seed-users.ts` for regeneration.

---

## 🏗 Infrastructure Setup

### 1. Docker Services

#### PostgreSQL Container

```bash
docker run -d \
  --name approvals-postgres \
  -e POSTGRES_USER=approvals \
  -e POSTGRES_PASSWORD=Qb4nYtL2uE7Xc9PzR1VfW3jK6mH8sA0D \
  -e POSTGRES_DB=approvals \
  -p 5432:5432 \
  -v postgres_data:/var/lib/postgresql/data \
  postgres:15-alpine
```

**Status**: `Up 30+ hours` (persistent)

**Connection String**:
```
postgresql://approvals:Qb4nYtL2uE7Xc9PzR1VfW3jK6mH8sA0D@localhost:5432/approvals?schema=public
```

### 2. Systemd Service

**Service File**: `/etc/systemd/system/approvals.service`

```ini
[Unit]
Description=Approvals Next.js Application
After=network.target postgresql.service

[Service]
Type=simple
User=root
WorkingDirectory=/home/approvals-nextjs
Environment=NODE_ENV=production
Environment=DATABASE_URL=postgresql://approvals:Qb4nYtL2uE7Xc9PzR1VfW3jK6mH8sA0D@localhost:5432/approvals?schema=public
Environment=NEXTAUTH_SECRET=Q1wE2rT3yU4iO5pA6sD7fG8hJ9kL0zXc
Environment=NEXTAUTH_URL=https://inhaj.com
Environment=NEXT_PUBLIC_SITE_URL=https://inhaj.com
EnvironmentFile=/home/approvals-nextjs/.env
ExecStartPre=/usr/bin/npm run build
ExecStart=/usr/bin/npm exec next start -- -H 127.0.0.1 -p 3000
Restart=always
RestartSec=5
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
```

**Service Management**:

```bash
# Check status
systemctl status approvals

# Start service
systemctl start approvals

# Stop service
systemctl stop approvals

# Restart service
systemctl restart approvals

# View logs
journalctl -u approvals -f

# Enable auto-start on boot
systemctl enable approvals
```

**Current Status**: `active (running)` - Process ID: 358606

---

## 🌍 Nginx Configuration

### Virtual Host File

**Location**: `/etc/nginx/sites-available/inhaj.com`

**HTTP (Port 80) - Redirects to HTTPS**:

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name inhaj.com www.inhaj.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $host;
        proxy_set_header X-Forwarded-Port 80;
        proxy_redirect http://localhost:3000/ http://$host/;
        proxy_redirect https://localhost:3000/ http://$host/;
    }
}
```

**HTTPS (Port 443) - SSL Enabled**:

```nginx
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name inhaj.com www.inhaj.com;

    ssl_certificate     /etc/letsencrypt/live/inhaj.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/inhaj.com/privkey.pem;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $host;
        proxy_set_header X-Forwarded-Port 443;
        proxy_redirect http://localhost:3000/ https://$host/;
        proxy_redirect https://localhost:3000/ https://$host/;
    }
}
```

**Enable Configuration**:

```bash
# Create symlink
ln -s /etc/nginx/sites-available/inhaj.com /etc/nginx/sites-enabled/

# Test configuration
nginx -t

# Reload Nginx
systemctl reload nginx
```

---

## 🔒 SSL/HTTPS Setup

### Certbot Configuration

**SSL Provider**: Let's Encrypt (via Certbot Snap)

**Certificate Location**:
- Certificate: `/etc/letsencrypt/live/inhaj.com/fullchain.pem`
- Private Key: `/etc/letsencrypt/live/inhaj.com/privkey.pem`

**Renewal**: Automatic via Certbot timer

**Initial Setup**:

```bash
# Install Certbot via Snap
sudo snap install --classic certbot

# Obtain certificate
sudo certbot certonly --nginx -d inhaj.com -d www.inhaj.com --email aldughairi@gmail.com

# Test renewal
sudo certbot renew --dry-run
```

**Auto-Renewal**: Enabled via systemd timer (runs daily)

---

## 💾 Database Configuration

### Prisma Setup

**Schema Location**: `/home/approvals-nextjs/prisma/schema.prisma`

**Migrations**:

```bash
cd /home/approvals-nextjs

# Generate Prisma Client
npm run prisma:generate

# Apply migrations
npm run prisma:deploy

# Seed database
npm run seed
```

**Database Access**:

```bash
# Connect via psql
psql -U approvals -d approvals -h localhost

# Or via Docker
docker exec -it approvals-postgres psql -U approvals -d approvals
```

**Prisma Studio** (GUI):

```bash
npx prisma studio --port 5555
# Access at http://localhost:5555
```

### Database Schema

```
User
├── id (UUID)
├── email (unique)
├── name
├── role (CEO | EXECUTIVE)
├── hashedPassword
└── created/updated timestamps

Request
├── id (UUID)
├── title
├── description
├── status (PENDING | PROCESSED | REJECTED)
├── createdById (User)
├── decidedById (User, nullable)
├── chosenSuggestionId (UUID, nullable)
├── otherDecision (text, nullable)
└── timestamps

Suggestion
├── id (UUID)
├── requestId (Request)
├── label
└── details

AuditLog
├── id (UUID)
├── actorId (User)
├── requestId (Request)
├── action (enum)
└── metadata (JSON)
```

---

## 📁 Application Structure

```
/home/approvals-nextjs/
├── .cursor/                    # Cursor workspace configuration
│   └── workspace.json
├── .cursorrules                # Cursor AI rules
├── app/                        # Next.js App Router
│   ├── [locale]/              # Internationalized routes
│   │   ├── dashboard/         # CEO dashboard (CEO only)
│   │   ├── my-requests/       # Executive requests page (Executive only)
│   │   ├── requests/[id]/     # Request detail view
│   │   ├── sign-in/           # Authentication page
│   │   └── page.tsx           # Homepage (landing)
│   ├── api/                   # API routes
│   │   ├── auth/[...nextauth] # NextAuth endpoints
│   │   ├── requests/          # Request CRUD operations
│   │   └── audit/             # Audit log endpoints
│   └── layout.tsx             # Root layout with providers
├── components/                 # React components
│   ├── ui/                   # shadcn/ui components
│   ├── layout/               # Layout components (MainLayout, RTLProvider)
│   ├── providers/            # Context providers (SessionProvider)
│   └── requests/             # Request-specific components
├── lib/                      # Utility libraries
│   ├── auth.ts              # NextAuth configuration
│   ├── db.ts                # Prisma client instance
│   ├── utils.ts             # Helper functions
│   └── validations.ts       # Zod schemas
├── messages/                 # Internationalization
│   ├── en.json              # English translations
│   └── ar.json              # Arabic translations
├── prisma/                   # Database
│   ├── schema.prisma        # Prisma schema
│   ├── migrations/          # Database migrations
│   └── seed.ts              # Seed script
├── scripts/                  # Utility scripts
│   └── seed-users.ts        # Custom user seeding
├── types/                    # TypeScript definitions
├── .env                      # Environment variables (not in git)
├── .eslintrc.json           # ESLint configuration
├── next.config.js           # Next.js configuration
├── package.json             # Dependencies
├── tailwind.config.ts       # Tailwind CSS configuration
├── tsconfig.json            # TypeScript configuration
└── README.md                # Original README
```

---

## 🔄 Development Workflow

### Local Development

```bash
# Navigate to project
cd /home/approvals-nextjs

# Install dependencies
npm install

# Start development server
npm run dev
# Access at http://localhost:3000
```

### Production Deployment

```bash
# Navigate to project
cd /home/approvals-nextjs

# Build application
npm run build

# Restart service
systemctl restart approvals

# Check status
systemctl status approvals

# View logs
journalctl -u approvals -f --lines 50
```

### Code Updates

```bash
# 1. Pull latest changes (if using Git)
git pull origin main

# 2. Install new dependencies (if any)
npm install

# 3. Run database migrations (if schema changed)
npm run prisma:generate
npm run prisma:deploy

# 4. Rebuild application
npm run build

# 5. Restart service
systemctl restart approvals
```

### Database Maintenance

```bash
# Backup database
docker exec approvals-postgres pg_dump -U approvals approvals > backup.sql

# Restore database
cat backup.sql | docker exec -i approvals-postgres psql -U approvals approvals

# Reset database (⚠️ destroys all data)
npm run prisma:migrate reset

# Seed fresh data
npm run seed
```

---

## 🛠 Dependencies

### Production Dependencies

```json
{
  "@prisma/client": "^5.15.0",
  "@radix-ui/react-*": "^1.0.5 - ^2.0.6",
  "bcryptjs": "^2.4.3",
  "next": "^15.0.0",
  "next-auth": "^4.24.7",
  "next-intl": "^4.3.9",
  "react": "^18.3.1",
  "react-dom": "^18.3.1",
  "react-hook-form": "^7.52.0",
  "zod": "^3.23.8"
}
```

### Development Dependencies

```json
{
  "@types/node": "^20.14.9",
  "@typescript-eslint/eslint-plugin": "^7.14.1",
  "eslint": "^8.57.0",
  "prisma": "^5.15.0",
  "tailwindcss": "^3.4.4",
  "typescript": "^5.5.2",
  "vitest": "^1.6.0"
}
```

---

## 📊 Production Status

### Running Services

| Service | Status | Container/PID |
|---------|--------|---------------|
| PostgreSQL | ✅ Running | `approvals-postgres` (Docker) |
| Next.js App | ✅ Running | PID 358606 (systemd) |
| Nginx | ✅ Running | systemd service |
| Certbot | ✅ Active | systemd timer |

### Application URLs

- **Production**: https://inhaj.com
- **Arabic (Default)**: https://inhaj.com/ar
- **English**: https://inhaj.com/en
- **Sign In**: https://inhaj.com/ar/sign-in
- **CEO Dashboard**: https://inhaj.com/ar/dashboard
- **Executive Requests**: https://inhaj.com/ar/my-requests

### Performance

- **Build Time**: ~7-8 seconds
- **Memory Usage**: ~216.5M (peak: 564.1M)
- **Process Status**: `active (running)` since last restart

---

## 🐛 Troubleshooting

### Application Not Responding

```bash
# Check service status
systemctl status approvals

# Check if Node.js is running on port 3000
netstat -tlnp | grep 3000

# Restart service
systemctl restart approvals

# Check Nginx status
systemctl status nginx

# Test Nginx configuration
nginx -t
```

### Database Connection Issues

```bash
# Check PostgreSQL container
docker ps | grep postgres

# Check container logs
docker logs approvals-postgres

# Restart container
docker restart approvals-postgres

# Test connection
psql -U approvals -d approvals -h localhost
```

### Build Failures

```bash
# Clear Next.js cache
rm -rf .next

# Clean node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Regenerate Prisma client
npm run prisma:generate

# Check TypeScript errors
npm run type-check
```

### SSL Certificate Issues

```bash
# Check certificate expiry
certbot certificates

# Renew certificate manually
certbot renew

# Check Nginx SSL configuration
nginx -t
systemctl reload nginx
```

### Internationalization Issues

```bash
# Verify translation files
ls -la messages/

# Check locale routing
curl -I https://inhaj.com/ar
curl -I https://inhaj.com/en

# Clear Next.js cache
rm -rf .next
npm run build
```

---

## 📝 Additional Notes

### Code Style

- **TypeScript**: Strict mode enabled
- **Formatting**: Prettier with Tailwind plugin
- **Linting**: ESLint with Next.js and TypeScript rules
- **RTL Support**: Default RTL (Arabic), LTR for English paths

### Security Considerations

- Strong passwords for database and NextAuth
- Environment variables not committed to Git
- HTTPS enforced via SSL certificates
- Role-based access control (RBAC)
- Input validation with Zod schemas
- SQL injection prevention via Prisma ORM

### Monitoring

- Service logs: `journalctl -u approvals -f`
- Nginx logs: `/var/log/nginx/access.log` and `error.log`
- Database logs: `docker logs approvals-postgres`

---

## 🔗 Quick Reference

### Essential Commands

```bash
# Build and restart
cd /home/approvals-nextjs && npm run build && systemctl restart approvals

# View application logs
journalctl -u approvals -f

# Access database
docker exec -it approvals-postgres psql -U approvals -d approvals

# Prisma Studio
cd /home/approvals-nextjs && npx prisma studio
```

### File Locations

- Application: `/home/approvals-nextjs`
- Environment: `/home/approvals-nextjs/.env`
- Service: `/etc/systemd/system/approvals.service`
- Nginx Config: `/etc/nginx/sites-available/inhaj.com`
- SSL Certificates: `/etc/letsencrypt/live/inhaj.com/`

---

**Last Updated**: October 29, 2025  
**Maintained By**: Development Team  
**Project Repository**: ProgSpaceSA/approvals-nextjs

---

**Built with ❤️ using Next.js 15, TypeScript, PostgreSQL, and modern web technologies.**

