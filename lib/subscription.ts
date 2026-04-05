import { User } from "@prisma/client";

export function canGenerate(user: User): boolean {
  if (user.plan === "PRO") return true;
  return user.generationsCount < 3;
}
