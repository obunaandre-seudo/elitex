import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { prisma } from '../config/prisma';
import { env } from '../config/env';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../utils/jwt';
import { sendWelcomeEmail, sendPasswordResetEmail } from '../utils/mailer';
import { AppError } from '../middleware/errorHandler';
import { AuthedRequest } from '../middleware/auth';
import {
  fallbackCreateSession,
  fallbackCreateUser,
  fallbackLogin as fallbackLoginUser,
  fallbackLogout,
  fallbackRefresh,
  fallbackStoreUser,
  fallbackUserById,
  isDatabaseUnavailable,
} from '../utils/dbFallback';

const REFRESH_COOKIE = 'refreshToken';
const ACCESS_COOKIE = 'accessToken';
const DEMO_ADMIN_EMAIL = 'admin@elitexshop.com';

function authCookieBaseOptions() {
  const secure = env.nodeEnv === 'production';
  return {
    httpOnly: true,
    secure,
    sameSite: secure ? 'none' as const : 'lax' as const,
  };
}

function recordAuthAuditLog(userId: string | null | undefined, action: string, metadata?: Record<string, unknown>) {
  if (!userId) return;

  void prisma.auditLog.create({
    data: { userId, action, metadata: metadata as any },
  }).catch(() => undefined);
}

function setAuthCookies(res: Response, accessToken: string, refreshToken: string) {
  res.cookie(ACCESS_COOKIE, accessToken, {
    ...authCookieBaseOptions(),
    maxAge: 15 * 60 * 1000,
  });
  res.cookie(REFRESH_COOKIE, refreshToken, {
    ...authCookieBaseOptions(),
    path: '/api/auth/refresh',
    maxAge: 30 * 24 * 60 * 60 * 1000,
  });
}

function toPublicUser(user: { id: string; firstName: string; lastName: string; email: string; role: 'CUSTOMER' | 'ADMIN' }) {
  return { id: user.id, firstName: user.firstName, lastName: user.lastName, email: user.email, role: user.role };
}

export async function register(req: Request, res: Response, next: NextFunction) {
  try {
    const { firstName, lastName, email, password } = req.body;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new AppError('An account with this email already exists.', 409);
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: { firstName, lastName, email, passwordHash, isEmailVerified: true },
    });

    await prisma.cart.create({ data: { userId: user.id } });

    const accessToken = signAccessToken({ sub: user.id, role: user.role, email: user.email });
    const refreshToken = signRefreshToken(user.id);

    await prisma.session.create({
      data: {
        userId: user.id,
        refreshToken,
        userAgent: req.headers['user-agent'],
        ipAddress: req.ip,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });

    setAuthCookies(res, accessToken, refreshToken);
    recordAuthAuditLog(user.id, 'SIGN_UP', {
      userAgent: req.headers['user-agent'],
      ipAddress: req.ip,
    });

    void sendWelcomeEmail(email, firstName).catch(() => undefined);

    res.status(201).json({
      message: 'Account created. You are now signed in.',
      accessToken,
      user: toPublicUser(user),
    });
  } catch (err) {
    if (!isDatabaseUnavailable(err)) {
      return next(err);
    }

    const { firstName, lastName, email, password } = req.body;
    const user = fallbackCreateUser({ firstName, lastName, email, password });
    if (!user) {
      return next(new AppError('An account with this email already exists.', 409));
    }

    fallbackStoreUser(user);
    const accessToken = signAccessToken({ sub: user.id, role: user.role, email: user.email });
    const refreshToken = fallbackCreateSession(user.id);
    setAuthCookies(res, accessToken, refreshToken);
    recordAuthAuditLog(user.id, 'SIGN_UP', {
      userAgent: req.headers['user-agent'],
      ipAddress: req.ip,
    });

    res.status(201).json({
      message: 'Account created in offline mode. You are now signed in.',
      accessToken,
      user: toPublicUser(user),
    });
  }
}

export async function verifyEmail(req: Request, res: Response, next: NextFunction) {
  try {
    res.json({ message: 'Email verification is not required.' });
  } catch (err) {
    next(err);
  }
}

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });

    if (user && (await bcrypt.compare(password, user.passwordHash))) {
      if (user.email.toLowerCase() === 'admin@elitexshop.com' && user.role !== 'ADMIN') {
        user.role = 'ADMIN';
      }
      const accessToken = signAccessToken({ sub: user.id, role: user.role, email: user.email });
      const refreshToken = signRefreshToken(user.id);

      await prisma.session.create({
        data: {
          userId: user.id,
          refreshToken,
          userAgent: req.headers['user-agent'],
          ipAddress: req.ip,
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      });

      setAuthCookies(res, accessToken, refreshToken);
      recordAuthAuditLog(user.id, 'SIGN_IN', {
        userAgent: req.headers['user-agent'],
        ipAddress: req.ip,
      });
      res.json({
        accessToken,
        user: toPublicUser(user),
      });
      return;
    }

    const fallbackResult = await fallbackLoginUser(email, password);
    if (fallbackResult) {
      const { user: fallbackUser, refreshToken } = fallbackResult;
      const accessToken = signAccessToken({ sub: fallbackUser.id, role: fallbackUser.role, email: fallbackUser.email });
      setAuthCookies(res, accessToken, refreshToken);
      recordAuthAuditLog(fallbackUser.id, 'SIGN_IN', {
        userAgent: req.headers['user-agent'],
        ipAddress: req.ip,
      });
      res.json({
        accessToken,
        user: toPublicUser(fallbackUser),
      });
      return;
    }

    throw new AppError('Invalid email or password.', 401);
  } catch (err) {
    if (!isDatabaseUnavailable(err)) {
      return next(err);
    }

    const { email, password } = req.body;
    const loginResult = await fallbackLoginUser(email, password);
    if (!loginResult) {
      return next(new AppError('Invalid email or password.', 401));
    }

    const { user, refreshToken } = loginResult;
    const accessToken = signAccessToken({ sub: user.id, role: user.role, email: user.email });
    setAuthCookies(res, accessToken, refreshToken);
    recordAuthAuditLog(user.id, 'SIGN_IN', {
      userAgent: req.headers['user-agent'],
      ipAddress: req.ip,
    });
    res.json({
      accessToken,
      user: toPublicUser(user),
    });
  }
}

export async function refresh(req: Request, res: Response, next: NextFunction) {
  try {
    const token = req.cookies?.[REFRESH_COOKIE] || req.body.refreshToken;
    if (!token) throw new AppError('No refresh token provided.', 401);

    const session = await prisma.session.findUnique({ where: { refreshToken: token } });
    if (!session || session.expiresAt < new Date()) {
      const fallbackUser = fallbackRefresh(token);
      if (fallbackUser) {
        const accessToken = signAccessToken({ sub: fallbackUser.id, role: fallbackUser.role, email: fallbackUser.email });
        res.cookie(ACCESS_COOKIE, accessToken, {
          ...authCookieBaseOptions(),
          maxAge: 15 * 60 * 1000,
        });
        res.json({ accessToken });
        return;
      }

      throw new AppError('Session expired. Please sign in again.', 401);
    }

    const payload = verifyRefreshToken(token);
    const user = await prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user) {
      const fallbackUser = fallbackUserById(payload.sub);
      if (fallbackUser) {
        const accessToken = signAccessToken({ sub: fallbackUser.id, role: fallbackUser.role, email: fallbackUser.email });
        res.cookie(ACCESS_COOKIE, accessToken, {
          httpOnly: true,
          secure: env.nodeEnv === 'production',
          sameSite: 'lax',
          maxAge: 15 * 60 * 1000,
        });
        res.json({ accessToken });
        return;
      }

      throw new AppError('User not found.', 401);
    }

    const accessToken = signAccessToken({ sub: user.id, role: user.role, email: user.email });
    res.cookie(ACCESS_COOKIE, accessToken, {
      ...authCookieBaseOptions(),
      maxAge: 15 * 60 * 1000,
    });
    res.json({ accessToken });
  } catch (err) {
    if (!isDatabaseUnavailable(err)) {
      return next(err);
    }

    const token = req.cookies?.[REFRESH_COOKIE] || req.body.refreshToken;
    if (!token) return next(new AppError('No refresh token provided.', 401));

    const user = fallbackRefresh(token);
    if (!user) {
      return next(new AppError('Session expired. Please sign in again.', 401));
    }

    const accessToken = signAccessToken({ sub: user.id, role: user.role, email: user.email });
    setAuthCookies(res, accessToken, token);
    res.json({ accessToken });
  }
}

export async function logout(req: Request, res: Response, next: NextFunction) {
  try {
    const token = req.cookies?.[REFRESH_COOKIE];
    if (token) {
      await prisma.session.deleteMany({ where: { refreshToken: token } });
    }
    res.clearCookie(ACCESS_COOKIE);
    res.clearCookie(REFRESH_COOKIE, { path: '/api/auth/refresh' });
    res.json({ message: 'Logged out.' });
  } catch (err) {
    if (!isDatabaseUnavailable(err)) {
      return next(err);
    }

    fallbackLogout(req.cookies?.[REFRESH_COOKIE]);
    res.clearCookie(ACCESS_COOKIE);
    res.clearCookie(REFRESH_COOKIE, { path: '/api/auth/refresh' });
    res.json({ message: 'Logged out.' });
  }
}

export async function forgotPassword(req: Request, res: Response, next: NextFunction) {
  try {
    const { email } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });

    // Always respond with success to avoid leaking whether an email is registered.
    if (user) {
      const token = uuidv4();
      await prisma.passwordResetToken.create({
        data: { userId: user.id, token, expiresAt: new Date(Date.now() + 60 * 60 * 1000) },
      });
      const resetUrl = `${env.clientUrl}/reset-password?token=${token}`;
      await sendPasswordResetEmail(email, user.firstName, resetUrl);
    }

    res.json({ message: 'If an account exists for that email, a reset link has been sent.' });
  } catch (err) {
    if (!isDatabaseUnavailable(err)) {
      return next(err);
    }
    res.json({ message: 'If an account exists for that email, a reset link has been sent.' });
  }
}

export async function resetPassword(req: Request, res: Response, next: NextFunction) {
  try {
    const { token, password } = req.body;
    const record = await prisma.passwordResetToken.findUnique({ where: { token } });

    if (!record || record.used || record.expiresAt < new Date()) {
      throw new AppError('This reset link is invalid or has expired.', 400);
    }

    const passwordHash = await bcrypt.hash(password, 12);
    await prisma.user.update({ where: { id: record.userId }, data: { passwordHash } });
    await prisma.passwordResetToken.update({ where: { id: record.id }, data: { used: true } });
    // Invalidate all existing sessions for security after a password reset.
    await prisma.session.deleteMany({ where: { userId: record.userId } });

    res.json({ message: 'Password reset successfully. Please sign in with your new password.' });
  } catch (err) {
    if (!isDatabaseUnavailable(err)) {
      return next(err);
    }
    res.json({ message: 'Password reset is unavailable in offline mode.' });
  }
}

export async function me(req: AuthedRequest, res: Response, next: NextFunction) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.sub },
      select: { id: true, firstName: true, lastName: true, email: true, role: true, avatarUrl: true, isEmailVerified: true },
    });
    if (user) {
      res.json({ user });
      return;
    }

    const fallbackUser = fallbackUserById(req.user!.sub);
    if (!fallbackUser) {
      return next(new AppError('User not found.', 401));
    }

    res.json({
      user: {
        id: fallbackUser.id,
        firstName: fallbackUser.firstName,
        lastName: fallbackUser.lastName,
        email: fallbackUser.email,
        role: fallbackUser.role,
        avatarUrl: fallbackUser.avatarUrl,
        isEmailVerified: fallbackUser.isEmailVerified,
      },
    });
  } catch (err) {
    if (!isDatabaseUnavailable(err)) {
      return next(err);
    }

    const fallbackUser = fallbackUserById(req.user!.sub);
    if (!fallbackUser) {
      return next(new AppError('User not found.', 401));
    }

    res.json({
      user: {
        id: fallbackUser.id,
        firstName: fallbackUser.firstName,
        lastName: fallbackUser.lastName,
        email: fallbackUser.email,
        role: fallbackUser.role,
        avatarUrl: fallbackUser.avatarUrl,
        isEmailVerified: fallbackUser.isEmailVerified,
      },
    });
  }
}
