import { comparePassword, hashPassword, hashToken } from '@/utils/hash.js';
import { signAccessToken, verifyToken } from '@/utils/jwt.js';

describe('auth primitives', () => {
  it('hashes and verifies passwords', async () => {
    const plain = 'SecurePass123!';
    const digest = await hashPassword(plain);

    await expect(comparePassword(plain, digest)).resolves.toBe(true);
    await expect(comparePassword('WrongPass123!', digest)).resolves.toBe(false);
  });

  it('produces deterministic token hashes', () => {
    const token = 'refresh-token-example';
    expect(hashToken(token)).toEqual(hashToken(token));
    expect(hashToken(token)).not.toEqual(hashToken('different-token'));
  });

  it('signs and verifies access tokens', () => {
    const token = signAccessToken({
      userId: '11111111-1111-1111-1111-111111111111',
      email: 'demo@taskflow.com',
      name: 'Demo User'
    });

    expect(verifyToken(token)).toEqual({
      id: '11111111-1111-1111-1111-111111111111',
      email: 'demo@taskflow.com',
      name: 'Demo User'
    });
  });
});
