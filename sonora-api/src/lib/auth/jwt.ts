import { SignJWT, jwtVerify } from "jose";
import { ApiError } from "../api-error.ts";

function getRequiredEnv(name: string): string {
  let value: string | undefined;
  if (typeof Deno !== "undefined") {
    value = Deno.env.get(name);
  } else {
    value = process.env[name];
  }
  if (!value) throw new Error(`${name} is not defined`);
  return value;
}

const jwtSecret = getRequiredEnv("JWT_SECRET");
let jwtExpiresIn = Deno.env.get("JWT_EXPIRES_IN") ?? "7d";

const secretKey = new TextEncoder().encode(jwtSecret);

export async function signAccessToken(userId: string): Promise<string> {
  return await new SignJWT({ sub: userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(jwtExpiresIn)
    .sign(secretKey);
}

export async function verifyAccessToken(token: string): Promise<string> {
  try {
    const { payload } = await jwtVerify(token, secretKey);
    if (typeof payload.sub !== "string") {
      throw new ApiError(401, "invalid token");
    }
    return payload.sub;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(401, "invalid or expired token");
  }
}
