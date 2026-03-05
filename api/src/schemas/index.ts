import { z } from 'zod';

// ─── Auth ─────────────────────────────────────────────────────────────────────

export const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z
    .string()
    .min(8)
    .regex(/[A-Z]/)
    .regex(/[0-9]/)
    .regex(/[^A-Za-z0-9]/),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

// ─── Tasks ────────────────────────────────────────────────────────────────────

export const createTaskSchema = z.object({
  title: z.string().min(1).max(120),
  description: z.string().max(500).optional(),
  priority: z.enum(['HIGH', 'MEDIUM', 'LOW']).default('MEDIUM'),
  dueDate: z.string().datetime().optional(),
  projectId: z.string().cuid().optional(),
});

export const updateTaskSchema = createTaskSchema
  .partial()
  .extend({ status: z.enum(['TODO', 'IN_PROGRESS', 'DONE']).optional() });

// ─── Projects ─────────────────────────────────────────────────────────────────

export const createProjectSchema = z.object({
  name: z.string().min(1).max(60),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  emoji: z.string().max(2).optional(),
});

export const updateProjectSchema = createProjectSchema.partial();
