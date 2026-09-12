import bcrypt from "bcryptjs";
import type { LoginInput, RegisterInput, User } from "../../shared/index.js";
import { userSchema } from "../../shared/index.js";
import { db } from "../../db/client.ts";
import { ConflictError, UnauthorizedError } from "../../lib/api-error.ts";
import { signAccessToken } from "../../lib/auth/jwt.ts";

interface UserRow {
  id: string;
  email: string;
  password_hash: string;
  display_name: string;
  created_at: Date;
}

function toPublicUser(row: UserRow): User {
  return userSchema.parse({
    id: row.id,
    email: row.email,
    displayName: row.display_name,
    createdAt: row.created_at.toISOString(),
  });
}

export async function register(input: RegisterInput) {
  const existing = await db.query<{ id: string }>(
    "SELECT id FROM users WHERE email = $1 LIMIT 1",
    [input.email]
  );

  if (existing.length > 0) {
    throw new ConflictError("email already registered");
  }

  const passwordHash = await bcrypt.hash(input.password, 10);

  const [user] = await db.query<UserRow>(
    "INSERT INTO users (email, password_hash, display_name) VALUES ($1, $2, $3) RETURNING *",
    [input.email, passwordHash, input.displayName]
  );

  return {
    user: toPublicUser(user),
    token: await signAccessToken(user.id),
  };
}

export async function login(input: LoginInput) {
  const [user] = await db.query<UserRow>(
    "SELECT * FROM users WHERE email = $1 LIMIT 1",
    [input.email]
  );

  if (!user) {
    throw new UnauthorizedError("invalid email or password");
  }

  const valid = await bcrypt.compare(input.password, user.password_hash);

  if (!valid) {
    throw new UnauthorizedError("invalid email or password");
  }

  return {
    user: toPublicUser(user),
    token: await signAccessToken(user.id),
  };
}

export async function getMe(userId: string) {
  const [user] = await db.query<UserRow>(
    "SELECT * FROM users WHERE id = $1 LIMIT 1",
    [userId]
  );

  if (!user) {
    throw new UnauthorizedError("user not found");
  }

  return toPublicUser(user);
}
