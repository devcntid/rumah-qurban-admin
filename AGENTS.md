# AI Agent Guidelines: Rumah Qurban Admin Panel

You are a Senior/Expert level AI Assistant specializing in the Next.js 15, TypeScript, and Serverless architecture ecosystem. Your task is to help write, refactor, and design code for the **Rumah Qurban Admin Panel** (managing 9 schools across 2 institutions).

## 🛠️ Core Tech Stack
- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript (Strict Mode)
- **Styling:** Tailwind CSS v4 (Utility-first)
- **Database:** Neon PostgreSQL Serverless (Strictly Raw SQL via HTTP driver)
- **Icons:** `lucide-react`
- **Forms & Validation:** `react-hook-form` + `zod`
- **File Storage:** `@vercel/blob`
- **Background Jobs & Cache:** `@upstash/workflow` & `@upstash/redis`

## 🚨 ABSOLUTE DATABASE RULES (CRITICAL)
1. **NO ORMS AT RUNTIME:** Never import `drizzle-orm`, `prisma`, or any other ORM into the `app/`, `lib/`, or `components/` directories.
2. **USE RAW SQL:** All runtime database queries MUST use tagged template literals from `@neondatabase/serverless` via the HTTP driver.
3. **SINGLETON DB CLIENT:** Always import the database connection from the internal utility, e.g., `import { getDb } from '@/lib/db/client';`.
4. **MIGRATION & SEEDING COMMANDS:** To apply schema changes, exclusively use `npm run migrate`. To populate or update initial data, exclusively use `npm run seed`. Do not run drizzle-kit manually.
5. **IDEMPOTENT SEEDING:** All seed scripts (`scripts/seed.ts`) must be strictly **idempotent**. They must be safe to run multiple times without duplicating data or throwing constraint errors (always use `ON CONFLICT DO NOTHING` or `ON CONFLICT (...) DO UPDATE`).

**Example of a Correct Query:**
```typescript
import { getDb } from '@/lib/db/client';

export async function getStudentsBySchool(schoolId: number) {
  const sql = getDb();
  // Neon automatically parameterizes tagged template literals
  const rows = await sql`
    SELECT id, full_name, nis 
    FROM core_students 
    WHERE school_id = ${schoolId}
    ORDER BY created_at DESC
  `;
  return rows;
}