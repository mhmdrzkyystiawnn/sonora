import { SignJWT, jwtVerify } from "jose";
import { ApiError } from "../api-error.ts";

let _jwtSecret: Uint8Array | null = null;
let _jwtExpiresIn = "7d";

export function initJwt(env: Record<string, string>) {
  const secret = env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET is not defined");
  }
  _jwtSecret = new TextEncoder().encode(secret);
  _jwtExpiresIn = env.JWT_EXPIRES_IN ?? "7d";
}

function getSecret(): Uint8Array {
  if (!_jwtSecret) {
    throw new Error("JWT not initialized. Call initJwt(env) first.");
  }
  return _jwtSecret;
}

export async function signAccessToken(userId: string): Promise<string> {
  return await new SignJWT({ sub: userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(_jwtExpiresIn)
    .sign(getSecret());
}

export async function verifyAccessToken(token: string): Promise<string> {
  try {
    const { payload } = await jwtVerify(token, getSecret());

    if (typeof payload.sub !== "string") {
      throw new ApiError(401, "invalid token");
    }

    return payload.sub;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(401, "invalid or expired token");
  }
}
