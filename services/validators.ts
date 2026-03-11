/**
 * @file services/validators.ts
 * @description Client-side Zod validation schemas for all TaskFlow forms.
 *
 * These schemas MIRROR the backend schemas in `api/src/schemas/index.ts`
 * so the same rules apply on both sides. If the backend changes a rule,
 * update this file to match.
 *
 * Usage:
 * ```ts
 * import { loginSchema, getFieldErrors } from '@/services/validators';
 *
 * const result = loginSchema.safeParse({ email, password });
 * if (!result.success) {
 *   const errors = getFieldErrors(result.error);
 *   // errors.email → 'Enter a valid email address'
 * }
 * ```
 */

import { z } from 'zod';

// ─── Auth ─────────────────────────────────────────────────────────────────────

/** Login form — mirrors backend loginSchema */
export const loginSchema = z.object({
  email:    z.string().min(1, 'Email is required').email('Enter a valid email address'),
  password: z.string().min(8, 'Password is required'),
});
export type LoginFormData = z.infer<typeof loginSchema>;

// ─────────────────────────────────────────────────────────────────────────────

/**
 * Register form — mirrors backend registerSchema.
 * Password rules: 8+ chars, 1 uppercase, 1 digit, 1 special character.
 * The .refine() cross-validates the two password fields.
 */
export const registerSchema = z.object({
  name:            z.string().min(2, 'Name must be at least 2 characters'),
  email:           z.string().min(1, 'Email is required').email('Enter a valid email address'),
  password: z.string()
    .min(8,          'Password must be at least 8 characters')
    .regex(/[A-Z]/,  'Password must contain an uppercase letter')
    .regex(/[0-9]/,  'Password must contain a number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain a special character'),
  confirmPassword: z.string().min(1, 'Please confirm your password'),
})
.refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path:    ['confirmPassword'],
});
export type RegisterFormData = z.infer<typeof registerSchema>;

// ─── Tasks ────────────────────────────────────────────────────────────────────

/** Create task form — mirrors backend createTaskSchema */
export const createTaskSchema = z.object({
  title:       z.string().min(1, 'Task title is required').max(120, 'Title must be under 120 characters'),
  description: z.string().max(500, 'Description must be under 500 characters').optional(),
  priority:    z.enum(['HIGH', 'MEDIUM', 'LOW']).default('MEDIUM'),
  /** Must be ISO 8601 — convert date pickers before passing */
  dueDate:     z.string().datetime({ message: 'Due date must be a valid ISO date-time string' }).optional(),
  projectId:   z.string().cuid('Invalid project ID').optional(),
});
export type CreateTaskFormData = z.infer<typeof createTaskSchema>;

/** Update task — all fields optional, adds status */
export const updateTaskSchema = createTaskSchema.partial().extend({
  status: z.enum(['TODO', 'IN_PROGRESS', 'DONE']).optional(),
});
export type UpdateTaskFormData = z.infer<typeof updateTaskSchema>;

// ─── Projects ─────────────────────────────────────────────────────────────────

/** Create project form — mirrors backend createProjectSchema */
export const createProjectSchema = z.object({
  name:  z.string().min(1, 'Project name is required').max(60, 'Name must be under 60 characters'),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Color must be a valid hex code like #6C63FF'),
  emoji: z.string().max(2, 'Emoji must be a single character').optional(),
});
export type CreateProjectFormData = z.infer<typeof createProjectSchema>;

export const updateProjectSchema = createProjectSchema.partial();
export type UpdateProjectFormData = z.infer<typeof updateProjectSchema>;

// ─── Profile ──────────────────────────────────────────────────────────────────

export const updateProfileSchema = z.object({
  name:  z.string().min(2, 'Name must be at least 2 characters').optional(),
  email: z.string().email('Enter a valid email address').optional(),
});
export type UpdateProfileFormData = z.infer<typeof updateProfileSchema>;

export const changePasswordSchema = z.object({
  currentPassword:    z.string().min(1, 'Current password is required'),
  newPassword: z.string()
    .min(8,          'Password must be at least 8 characters')
    .regex(/[A-Z]/,  'Password must contain an uppercase letter')
    .regex(/[0-9]/,  'Password must contain a number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain a special character'),
  confirmNewPassword: z.string().min(1, 'Please confirm your new password'),
})
.refine((data) => data.newPassword === data.confirmNewPassword, {
  message: 'Passwords do not match',
  path:    ['confirmNewPassword'],
});
export type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;

// ─── Helper ───────────────────────────────────────────────────────────────────

/**
 * Converts a ZodError into a flat `{ fieldName: firstErrorMessage }` map,
 * ready to bind directly to component error props.
 *
 * @param error - The ZodError from a failed safeParse
 * @returns     `{ email: 'Enter a valid email', password: '...' }`
 */
export function getFieldErrors(error: z.ZodError): Record<string, string> {
  const flat = error.flatten().fieldErrors;
  return Object.fromEntries(
    Object.entries(flat).map(([key, messages]) => [key, messages?.[0] ?? 'Invalid value'])
  );
}
