import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import type { LoginInput, RegisterInput, User } from "@sonora/shared";
import { userSchema } from "@sonora/shared";
import { db } from "../../db/client.ts";
import type { UserRow } from "../../db/schema.ts";
import { users } from "../../db/schema.ts";
import { ConflictError, UnauthorizedError } from "../../lib/api-error.ts";
import { signAccessToken } from "../../lib/auth/jwt.ts";

function toPublicUser(row: UserRow): User {
  return userSchema.parse({
    id: row.id,
    email: row.email,
    displayName: row.displayName,
    createdAt: row.createdAt.toISOString(),
  });
}

export async function register(input: RegisterInput) {
  const existing = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, input.email))
    .limit(1);

  if (existing.length > 0) {
    throw new ConflictError("email already registered");
  }

  const passwordHash = await bcrypt.hash(input.password, 10);

  const [user] = await db
    .insert(users)
    .values({
      email: input.email,
      passwordHash,
      displayName: input.displayName,
    })
    .returning();

  return {
    user: toPublicUser(user),
    token: await signAccessToken(user.id),
  };
}

export async function login(input: LoginInput) {
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, input.email))
    .limit(1);

  if (!user) {
    throw new UnauthorizedError("invalid email or password");
  }

  const valid = await bcrypt.compare(input.password, user.passwordHash);

  if (!valid) {
    throw new UnauthorizedError("invalid email or password");
  }

  return {
    user: toPublicUser(user),
    token: await signAccessToken(user.id),
  };
}

export async function getMe(userId: string) {
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!user) {
    throw new UnauthorizedError("user not found");
  }

  return toPublicUser(user);
}
