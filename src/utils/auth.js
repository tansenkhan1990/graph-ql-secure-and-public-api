import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { User } from '../models/User.js';

export function signToken(userId) {
  return jwt.sign({ sub: userId }, env.jwtSecret, { expiresIn: env.jwtExpiresIn });
}

export async function getUserFromAuthHeader(authHeader) {
  if (!authHeader?.startsWith('Bearer ')) return null;
  const token = authHeader.slice(7);
  try {
    const payload = jwt.verify(token, env.jwtSecret);
    // fetch user without password
    const user = await User.findById(payload.sub).lean();
    return user || null;
  } catch {
    return null;
  }
}

export function requireAuth(ctx) {
  if (!ctx.user) {
    const err = new Error('Unauthorized');
    err.code = 'UNAUTHORIZED';
    throw err;
  }
}
