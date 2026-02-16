import { prisma } from '@/config/prisma.js';
import { AppError } from '@/utils/errors.js';
import { comparePassword, hashPassword, hashToken } from '@/utils/hash.js';
import { serializeUser } from '@/utils/serializers.js';
import { signAccessToken, signRefreshToken, verifyToken } from '@/utils/jwt.js';

interface AuthPayload {
  token: string;
  refresh_token: string;
  user: ReturnType<typeof serializeUser>;
}

const issueTokens = async (user: { id: string; email: string; name: string }): Promise<{ token: string; refreshToken: string }> => {
  const payload = {
    userId: user.id,
    email: user.email,
    name: user.name
  };

  const token = signAccessToken(payload);
  const { token: refreshToken, expiresAt } = signRefreshToken(payload);

  await prisma.refreshToken.create({
    data: {
      userId: user.id,
      tokenHash: hashToken(refreshToken),
      expiresAt
    }
  });

  return { token, refreshToken };
};

export const authService = {
  async signup(name: string, email: string, password: string): Promise<AuthPayload> {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new AppError('CONFLICT', 'User with this email already exists', 409);
    }

    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash: await hashPassword(password)
      }
    });

    const { token, refreshToken } = await issueTokens(user);

    return {
      token,
      refresh_token: refreshToken,
      user: serializeUser(user)
    };
  },

  async login(email: string, password: string): Promise<AuthPayload> {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new AppError('UNAUTHORIZED', 'Invalid email or password', 401);
    }

    const valid = await comparePassword(password, user.passwordHash);
    if (!valid) {
      throw new AppError('UNAUTHORIZED', 'Invalid email or password', 401);
    }

    const { token, refreshToken } = await issueTokens(user);

    return {
      token,
      refresh_token: refreshToken,
      user: serializeUser(user)
    };
  },

  async me(userId: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new AppError('NOT_FOUND', 'User not found', 404);
    }

    return { user: serializeUser(user) };
  },

  async refresh(refreshToken: string): Promise<AuthPayload> {
    const decoded = verifyToken(refreshToken);
    const tokenHash = hashToken(refreshToken);

    const stored = await prisma.refreshToken.findFirst({
      where: {
        tokenHash,
        userId: decoded.id,
        revokedAt: null,
        expiresAt: { gt: new Date() }
      },
      include: {
        user: true
      }
    });

    if (!stored) {
      throw new AppError('UNAUTHORIZED', 'Invalid refresh token', 401);
    }

    await prisma.refreshToken.update({
      where: { id: stored.id },
      data: { revokedAt: new Date() }
    });

    const { token, refreshToken: nextRefresh } = await issueTokens(stored.user);

    return {
      token,
      refresh_token: nextRefresh,
      user: serializeUser(stored.user)
    };
  },

  async logout(refreshToken: string): Promise<void> {
    const tokenHash = hashToken(refreshToken);

    await prisma.refreshToken.updateMany({
      where: {
        tokenHash,
        revokedAt: null
      },
      data: {
        revokedAt: new Date()
      }
    });
  }
};
