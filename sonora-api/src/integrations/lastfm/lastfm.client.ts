import { ApiError } from "../../lib/api-error.ts";

type LastFmConfig = {
  apiUrl: string;
  apiKey: string;
};

let _config: LastFmConfig | null = null;

export function initLastFmConfig(env: Record<string, string>) {
  _config = {
    apiUrl: env.LASTFM_API_URL,
    apiKey: env.LASTFM_API_KEY,
  };
}

export function getLastFmConfig(): LastFmConfig {
  if (!_config) {
    throw new Error("Last.fm config not initialized. Call initLastFmConfig(env) first.");
  }
  return _config;
}

type lastFmRequestParams = Record<string, string>;

export async function lastFmRequest<T>(
  params: lastFmRequestParams,
): Promise<T> {
  const config = getLastFmConfig();
  const searchParams = new URLSearchParams(params);

  searchParams.set("api_key", config.apiKey);
  searchParams.set("format", "json");

  const response = await fetch(
    `${config.apiUrl}?${searchParams.toString()}`,
  );

  if (!response.ok) {
    throw new ApiError(
      502,
      `last.fm request failed with status ${response.status}`,
    );
  }

  return response.json() as Promise<T>;
}
