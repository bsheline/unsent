import { canGenerate } from './subscription';
import { User } from '@prisma/client';

describe('subscription lib', () => {
  describe('canGenerate', () => {
    it('should return true if user is PRO plan regardless of generations count', () => {
      const user: User = {
        id: '1',
        clerkId: 'user_1',
        plan: 'PRO',
        generationsCount: 10,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      expect(canGenerate(user)).toBe(true);
    });

    it('should return true if user is not PRO but has less than 3 generations', () => {
      const user: User = {
        id: '1',
        clerkId: 'user_1',
        plan: 'FREE',
        generationsCount: 2,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      expect(canGenerate(user)).toBe(true);
    });

    it('should return false if user is not PRO and has 3 or more generations', () => {
      const user: User = {
        id: '1',
        clerkId: 'user_1',
        plan: 'FREE',
        generationsCount: 3,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      expect(canGenerate(user)).toBe(false);

      const userMore: User = {
        id: '1',
        clerkId: 'user_1',
        plan: 'FREE',
        generationsCount: 5,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      expect(canGenerate(userMore)).toBe(false);
    });
  });
});
