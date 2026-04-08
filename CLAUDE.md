***

### 2. `claude.md` (For Claude Project Knowledge / System Prompt)
Save this as `claude.md` or paste its contents into the "Project Instructions" box if you are using Claude.ai Projects or Claude Dev:

```markdown
# System Prompt & Project Context: Rumah Qurban Admin Panel

## 🏢 Business Context
You are building the **Admin Panel (Dashboard) for the Rumah Qurban System**. This system serves 9 school entities under two foundations (Kreativa Global & Talenta Juara). The Admin Panel is used by school staff, finance admins, and field staff to:
1. Manage Master Data (Students, Branches, Vendors, Pricing).
2. Verify Qurban orders and manual bank transfers.
3. Upload slaughter documentation (Photos/Videos) per animal eartag.
4. Manage Qurban logistics and delivery statuses.
5. Generate cross-school transaction reports.

## 🛠️ Strict Technical Directives

### 1. Database Layer (Raw SQL Only)
This project adopts a **Zero-ORM at Runtime** principle to achieve minimal latency on Vercel Serverless cold starts.
- You are **FORBIDDEN** from writing runtime queries using Drizzle ORM, Prisma, or any query builders.
- You are **REQUIRED** to use Raw SQL via the `@neondatabase/serverless` driver (the `neon()` HTTP function).
- Drizzle exists in this project purely as a schema generation tool (`scripts/schema/schema.ts`). Ignore Drizzle entirely when writing application features.
- **Must use Parameterized Queries** to prevent SQL Injection (use the `${variable}` format within Neon's tagged templates).

### 2. Migrations, Seeding, and Idempotency
- **Commands:** Always instruct the user to run `npm run migrate` to apply database schema changes, and `npm run seed` to inject initial data.
- **Idempotency:** Every SQL statement inside the seed script MUST be idempotent. Data must be inserted using clauses like `ON CONFLICT DO NOTHING` or `ON CONFLICT (...) DO UPDATE` so that executing `npm run seed` 100 times yields the exact same database state as executing it once without errors.

### 3. App Router & Modern Architecture
- Use the Next.js 15 App Router architecture.
- Habituate the **Server-first** pattern: Fetch data directly inside Server Components (`page.tsx` or `layout.tsx`).
- Emphasize **Reusable Components**: Abstract UI elements like tables, buttons, and inputs into generic components.
- For forms adding/editing admin data, use a combination of **Client Forms (React Hook Form + Zod)** that submit validated data to **Next.js Server Actions**.
- Handle loading states using `loading.tsx`, `useTransition`, or `React.Suspense`.

### 4. File Uploads (Vercel Blob)
Field admins are responsible for uploading photos/videos of the Qurban animals.
- Use `@vercel/blob` for handling all media uploads.
- The upload Server Action must validate the file type (images/videos only) and return the public URL.
- Ensure the generated media URL is saved to the `slaughter_documentations` table using Raw SQL.

### 5. Multi-Tenant Data Isolation (Security)
Data security is the top priority. Because 1 database hosts 9 schools:
- Always assume the current admin session (`session.schoolId`) is available.
- Never execute `SELECT * FROM orders` without filtering. Always ensure queries enforce tenant isolation:
  `SELECT * FROM orders WHERE school_id = ${session.schoolId}`.

## 🔄 Expected Workflow for New Features
If the user asks you to build a new page or feature in the Admin Panel, follow this mental framework:
1. **Define Types/Interfaces:** Create strict TypeScript interfaces for the related entities.
2. **Create Server Action / Query Function:** Write the asynchronous function utilizing **Raw SQL** inside the `lib/db/queries/` directory. Ensure tenant isolation.
3. **Build or Reuse Components:** Utilize existing generic components (like `<DataTable />`) or create new highly reusable ones.
4. **Create Server Component UI:** Build the `page.tsx` that calls the query function and passes the data to the UI components.
5. **Create Client Components (If mutating):** Build `'use client'` form components styled with Tailwind, protected by Zod validation, wired to a Server Action.

Provide only clean, modular, and to-the-point code. Avoid unnecessary boilerplate.