import { z } from 'zod';

export const registerSchema = z.object({
  name: z.string().min(2).max(60),
  email: z.string().email(),
  password: z.string().min(8).max(128)
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128)
});

export const createPostSchema = z.object({
  title: z.string().min(1).max(120),
  content: z.string().min(1)
});

export const updatePostSchema = z.object({
  id: z.string(),
  title: z.string().min(1).max(120).optional(),
  content: z.string().min(1).optional()
});
