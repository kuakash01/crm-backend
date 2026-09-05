# CRM Platform — Backend

The backend API for a full-stack Customer Relationship Management (CRM) platform.

Built with Node.js, Express, TypeScript, and PostgreSQL, the backend provides authentication, authorization, CRM operations, invitations, notifications, real-time communication, transactional email, and background jobs.

## Features

### Authentication & Security
- User registration
- Email verification with OTP
- Login and logout
- Forgot-password flow with OTP
- Password reset
- Change password
- JWT authentication
- HTTP-only cookies
- Password hashing with bcrypt/bcryptjs
- OTP hashing with a secret pepper
- Account activation/deactivation

### User & Organization Management
- Organization users
- User invitations
- Pending invitation management
- Invitation expiration and revocation
- Invitation acceptance
- Role assignment
- Reporting relationships
- Profile retrieval and updates

### Authorization
- Organization-specific roles
- Module-based permissions
- Granular actions
- Backend authorization
- Admin permissions

### CRM
- Leads and lead conversion
- Customers
- Deals and pipeline stages
- Tasks, priorities, and due dates
- Services and pricing
- Notes
- Activity history
- Notifications

### Real-Time & Background Processing
- Socket.IO
- Real-time notifications
- Notification cleanup job

### Email
Brevo transactional email is used for:
- Email verification
- User invitations
- Password reset

## Tech Stack

- Node.js
- Express
- TypeScript
- PostgreSQL
- `pg`
- bcrypt / bcryptjs
- JWT
- Socket.IO
- Brevo
- dotenv
- Cron/background jobs

## Architecture

The backend uses a modular structure and keeps business logic in services.

```text
Route
  ↓
Controller
  ↓
Service
  ↓
PostgreSQL
```

Project structure:

```text
backend/
└── src/
    ├── config/
    ├── jobs/
    ├── modules/
    │   ├── auth/
    │   ├── users/
    │   ├── leads/
    │   ├── customers/
    │   ├── deals/
    │   ├── tasks/
    │   ├── services/
    │   ├── notifications/
    │   └── ...
    ├── shared/
    │   ├── helpers/
    │   ├── middleware/
    │   └── ...
    ├── app.ts
    └── server.ts
```

## Environment Variables

Create `.env` in the backend root.

```env
# Server
PORT=8000
CORS_ORIGIN=http://localhost:3000

# PostgreSQL
DATABASE_URL=postgresql://postgres:your_password@localhost:5432/crm_db

# Authentication & Security
COOKIE_SECURE=false
COOKIE_SAME_SITE=lax
COOKIE_EXPIRES_DAYS=7
BCRYPT_SALT_ROUNDS=10
JWT_SECRET=your_secret_key
JWT_EXPIRES_IN=7d
OTP_PEPPER=your_random_otp_pepper

# Brevo
BREVO_API_KEY=your_brevo_api_key
BREVO_FROM_EMAIL=your_sender_email
BREVO_FROM_NAME=CRM Platform
```

| Variable | Description | Example |
|---|---|---|
| `PORT` | HTTP server port. Render supplies this automatically in production. | `8000` |
| `CORS_ORIGIN` | Allowed frontend origin. | `http://localhost:3000` |
| `DATABASE_URL` | PostgreSQL connection string. | `postgresql://postgres:password@localhost:5432/crm_db` |
| `COOKIE_SECURE` | Enables the `Secure` cookie flag. | `false` |
| `COOKIE_SAME_SITE` | SameSite policy for authentication cookies. | `lax` |
| `COOKIE_EXPIRES_DAYS` | Authentication cookie lifetime in days. | `7` |
| `BCRYPT_SALT_ROUNDS` | bcrypt hashing rounds. | `10` |
| `JWT_SECRET` | Secret used to sign JWTs. | `your_secret_key` |
| `JWT_EXPIRES_IN` | JWT expiration duration. | `7d` |
| `OTP_PEPPER` | Secret used to protect OTP values. | `your_random_otp_pepper` |
| `BREVO_API_KEY` | Brevo transactional email API key. | `your_brevo_api_key` |
| `BREVO_FROM_EMAIL` | Sender email address. | `sender@example.com` |
| `BREVO_FROM_NAME` | Sender name shown in email. | `CRM Platform` |

## Getting Started

### Prerequisites

- Node.js
- npm
- PostgreSQL

### 1. Clone and install

```bash
git clone https://github.com/kuakash01/crm-backend.git
cd crm-backend
npm install
```

### 2. Create the database

Create a PostgreSQL database named:

```text
crm_db
```

Example:

```sql
CREATE DATABASE crm_db;
```

### 3. Configure `.env`

Use the environment configuration shown above.

### 4. Run migrations

Execute the SQL migrations in numerical order:

```text
001 → 002 → 003 → ... → 024
```

## Database

PostgreSQL is the primary data store and the schema is maintained through sequential SQL migrations.

### Migration sequence

```text
001  create organizations
002  create roles
003  create users
004  create lead enums
005  create leads
006  create modules
007  create permissions
008  create permissions for modules
009  create role permissions
010  create entity type
011  create generic activities
012  create notes
013  create tasks
014  create customer status enum
015  create customer origin enum
016  create customers
017  create services
018  create deal stages
019  create deals
020  create notification types
021  create notification actions
022  create notifications
023  create authentication OTP challenges
024  create user invitations
```

The migrations define the database schema, PostgreSQL ENUMs, primary keys, foreign keys, unique constraints, check constraints, defaults, `NOT NULL` constraints, and delete behavior.

### Main data relationships

```text
organizations
    │
    ├── users
    ├── roles
    ├── leads
    ├── customers
    ├── deals
    ├── tasks
    ├── services
    ├── notes
    ├── activities
    ├── notifications
    └── user_invitations
```

Relationships use `CASCADE`, `SET NULL`, and `RESTRICT` where appropriate.

## PostgreSQL Connection

The backend uses a PostgreSQL connection string through `pg`:

```ts
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});
```

Local example:

```env
DATABASE_URL=postgresql://postgres:your_password@localhost:5432/crm_db
```

A cloud provider such as Neon can provide the production connection string.

## Authentication Flows

### Registration

```text
Register
   ↓
Create organization
   ↓
Create admin role
   ↓
Create user
   ↓
Create verification OTP
   ↓
Send email
   ↓
Verify email
   ↓
Login
```

### User Invitation

```text
Admin
   ↓
Create invitation
   ↓
Store invitation token hash
   ↓
Send invitation email
   ↓
User opens invitation
   ↓
Creates password
   ↓
Create user
   ↓
Consume invitation
```

### Password Recovery

```text
Forgot password
   ↓
Submit email
   ↓
Create password-reset OTP
   ↓
Send email
   ↓
Submit OTP + new password
   ↓
Reset password
```

## Security

- Passwords are hashed before storage.
- JWT authentication is used for authenticated sessions.
- Authentication cookies are HTTP-only.
- OTP values are protected before storage and have expiration/attempt limits.
- Authorization is enforced on the backend.
- Secrets are supplied through environment variables.

## Real-Time Communication

Socket.IO is attached to the same HTTP server as Express:

```text
HTTP Server
├── Express REST API
└── Socket.IO
```

This supports real-time notification delivery.

## Background Jobs

Background jobs are initialized when the server starts. The current scheduled maintenance includes notification cleanup.

## Email

Brevo is used for transactional email delivery.

```env
BREVO_API_KEY=
BREVO_FROM_EMAIL=
BREVO_FROM_NAME=
```

## Running the Backend

Development:

```bash
npm run dev
```

Production build:

```bash
npm run build
```

Production start:

```bash
npm run start
```

Local backend:

```text
http://localhost:8000
```

## Production Deployment

The backend can be deployed independently from the frontend.

Example setup:

```text
Frontend  → Vercel
Backend   → Render
Database  → Neon PostgreSQL
Email     → Brevo
```

### Render configuration

For a normal Node.js deployment on Render:

- Deploy the backend as a Node web service.
- Render supplies `PORT` automatically.
- Configure `DATABASE_URL` with the production PostgreSQL connection string.
- Configure `CORS_ORIGIN` with the production frontend URL.
- Use secure cookies in production.

Example production environment:

```env
CORS_ORIGIN=https://your-frontend-url.com
DATABASE_URL=your_production_postgresql_url

COOKIE_SECURE=true
COOKIE_SAME_SITE=lax
COOKIE_EXPIRES_DAYS=7

BCRYPT_SALT_ROUNDS=10
JWT_SECRET=your_production_jwt_secret
JWT_EXPIRES_IN=7d
OTP_PEPPER=your_production_otp_pepper

BREVO_API_KEY=your_brevo_api_key
BREVO_FROM_EMAIL=your_sender_email
BREVO_FROM_NAME=CRM Platform
```

## Database Backup

Before moving the development/demo database to another PostgreSQL instance, create a backup:

```bash
pg_dump -U postgres -d crm_db -Fc -f crm_backup.dump
```

The dump can be restored into another PostgreSQL instance.

## Migration Workflow

Schema changes should use a new migration instead of editing an already-applied migration.

```text
025_add_feature.sql
026_update_feature.sql
```

Keep the migration files in version control so the database schema can be recreated consistently.

## Environment & Secrets

Never commit environment files containing secrets.

Recommended `.gitignore` entries:

```gitignore
.env
.env.*
!.env.example
node_modules/
dist/
```

Never expose:

```text
DATABASE_URL
JWT_SECRET
OTP_PEPPER
BREVO_API_KEY
```

## Project Status

The backend currently supports organizations, users, roles, permissions, leads, customers, deals, tasks, services, notes, activities, notifications, authentication, email verification, password management, user invitations, real-time notifications, and background cleanup jobs.

## Author

**Akash Kumar**

A full-stack CRM project built as a hands-on exploration of real-world application architecture, authentication, RBAC, PostgreSQL, REST APIs, Redux Toolkit, Socket.IO, transactional email, and cloud deployment.
