import { ApiError } from "../../lib/api-error.ts";

function getRequiredEnv(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`${name} is not defined`);
  }

  return value;
}

const lastFmApiUrl = getRequiredEnv("LASTFM_API_URL");
const apiKey = getRequiredEnv("LASTFM_API_KEY");

type lastFmRequestParams = Record<string, string>;

export async function lastFmRequest<T>(
  params: lastFmRequestParams,
): Promise<T> {
  const searchParams = new URLSearchParams(params);

  searchParams.set("api_key", apiKey);
  searchParams.set("format", "json");

  const response = await fetch(
    `${lastFmApiUrl}?${searchParams.toString()}`,
  );

  if (!response.ok) {
    throw new ApiError(
      502,
      `last.fm request failed with status ${response.status}`,
    );
  }

  return response.json() as Promise<T>;
}