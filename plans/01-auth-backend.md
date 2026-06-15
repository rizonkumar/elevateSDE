# Feature Plan: User Authentication & RBAC (Backend)

Implementation details for setting up authentication, Role-Based Access Control (RBAC), database schemas, and Swagger API documentation on the NestJS backend.

---

## 1. Objectives

- Set up database models for `Tenant` and `User` using Prisma.
- Implement password hashing using `bcrypt`.
- Implement JWT-based authentication with access and refresh token rotation.
- Set up Role-Based Access Control (RBAC) with roles: `USER` (B2C Candidate), `TENANT_ADMIN` (B2B Manager), and `ADMIN` (Super Admin).
- Setup OpenAPI/Swagger documentation for all auth and user endpoints.

---

## 2. Database Schema (Prisma)

We will define the following models in `apps/api/prisma/schema.prisma`:

```prisma
enum UserRole {
  USER
  TENANT_ADMIN
  ADMIN
}

model Tenant {
  id               String   @id @default(uuid())
  name             String
  stripeCustomerId String?
  subscriptionPlan String   @default("FREE")
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt
  users            User[]
}

model User {
  id           String    @id @default(uuid())
  tenantId     String?
  email        String    @unique
  passwordHash String
  role         UserRole  @default(USER)
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt
  tenant       Tenant?   @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  refreshTokens RefreshToken[]
}

model RefreshToken {
  id        String   @id @default(uuid())
  userId    String
  token     String   @unique
  expiresAt DateTime
  createdAt DateTime @default(now())
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}
```

---

## 3. API Use Cases & Endpoints

### Auth Controller (`/api/v1/auth`)

- `POST /register`: Registers a new user. If registering a B2B tenant, a `Tenant` record is created concurrently and the user is assigned the `TENANT_ADMIN` role.
- `POST /login`: Validates email and password, generates and returns access and refresh tokens.
- `POST /refresh`: Verifies the refresh token, revokes it, and issues a new access/refresh token pair.
- `POST /logout`: Revokes the active refresh token.

### Users Controller (`/api/v1/users`)

- `GET /me`: Returns the current user profile. Guarded by JWT Auth.
- `PATCH /:id/role`: Updates the user's role. Guarded by `ADMIN` role.

---

## 4. Implementation Steps

### Step 4.1: Database Setup

1. Initialize Prisma inside `apps/api` and configure the PostgreSQL connection.
2. Define the schema in `schema.prisma`.
3. Generate the Prisma client.

### Step 4.2: Core Modules & Guard Setup

1. Setup a `PrismaService` for database access.
2. Implement `AuthService` and `UsersService`.
3. Create `JwtStrategy` and guards (`JwtAuthGuard`, `RolesGuard`).
4. Design the `@Roles` custom decorator to enable endpoint protection.

### Step 4.3: Controllers & Use Cases

1. Set up DTOs with validation rules.
2. Implement register/login use cases.
3. Implement RBAC controls on the users controller.

### Step 4.4: Swagger Integration

1. Set up Swagger inside `apps/api/src/main.ts`.
2. Annotate DTOs and endpoints with `@ApiProperty`, `@ApiResponse`, and `@ApiBearerAuth`.

---

## 5. Verification Plan

- Run manual test calls using Swagger UI at `http://localhost:3000/api/docs`.
- Write Jest unit tests for `AuthService` registration, login, and token rotation.
