import { User } from '@prisma/client'

export function canGenerate(user: User): boolean {
  return user.plan === 'PRO'
}
