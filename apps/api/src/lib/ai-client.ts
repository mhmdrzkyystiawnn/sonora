import { z } from "zod";
import {
  aiRerankResultSchema,
  playlistDraftResponseSchema,
} from "@sonora/shared";

type RerankCandidate = {
  name: string;
  source: string;
};

type MoodTrackCandidate = {
  name: string;
  artistName: string;
  source: string;
};

const aiMoodResultSchema = z.array(
  z.object({
    name: z.string(),
    artistName: z.string(),
    reason: z.string(),
  }),
);

function getGeminiKey(): string {
  const key = process.env.GEMINI_API_KEY;

  if (!key) {
    throw new Error("GEMINI_API_KEY is not defined");
  }

  return key;
}

async function callGemini<T>(prompt: string, schema: z.ZodType<T>): Promise<T> {
  const apiKey = getGeminiKey();
  const model = process.env.GEMINI_MODEL ?? "gemini-3.5-flash-lite";

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
  const body = JSON.stringify({
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    generationConfig: {
      responseMimeType: "application/json",
      temperature: 0.5,
    },
  });

  let response: Response | null = null;

  for (let attempt = 0; attempt < 3; attempt += 1) {
    response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
    });

    if (response.ok) {
      break;
    }

    if (response.status === 429 || response.status === 503) {
      if (attempt < 2) {
        await new Promise((resolve) =>
          setTimeout(resolve, 1000 * Math.pow(2, attempt)),
        );
        continue;
      }
    }

    throw new Error(`gemini request failed with status ${response.status}`);
  }

  const data = (await response!.json()) as {
    candidates?: Array<{
      content?: {
        parts?: Array<{ text?: string }>;
      };
    }>;
  };

  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

  if (typeof text !== "string") {
    throw new Error("gemini returned no text");
  }

  const parsed = schema.safeParse(JSON.parse(text));

  if (!parsed.success) {
    throw new Error("gemini returned invalid json");
  }

  return parsed.data;
}

export async function rerankCandidates(input: {
  taste: string[];
  candidates: RerankCandidate[];
}): Promise<Array<{ name: string; reason: string }>> {
  const tasteLine = input.taste.join(", ");
  const candidatesLine = input.candidates
    .map((candidate) => `- ${candidate.name} (similar to ${candidate.source})`)
    .join("\n");

  const prompt = `You are a music recommendation engine.
A user regularly listens to: ${tasteLine}.

Here is a list of candidate artists (each with the artist they are similar to):
${candidatesLine}

Pick the top 8 candidates most relevant to the user's taste and return them ordered by relevance. For each, write a short one-sentence reason (under 25 words) explaining why it fits the user's taste. Refer to artists by their exact name as listed.

Respond with ONLY valid JSON in this exact shape, no markdown:
[{"name": "<artist name>", "reason": "<short reason>"}]`;

  return callGemini(prompt, aiRerankResultSchema);
}

export async function selectMoodTracks(input: {
  mood: string;
  candidates: MoodTrackCandidate[];
}): Promise<Array<{ name: string; artistName: string; reason: string }>> {  const candidatesLine = input.candidates
    .map(
      (candidate) =>
        `- "${candidate.name}" by ${candidate.artistName} (from ${candidate.source})`,
    )
    .join("\n");

  const prompt = `You are a music playlist builder.
A user is looking for music to match this mood/vibe/activity: "${input.mood}".

Here is a list of candidate tracks:
${candidatesLine}

Pick the 10 tracks that best match the mood. Return them ordered by how well they fit. For each, write a short one-sentence reason (under 20 words) explaining the fit. Refer to tracks by their exact name and artist as listed.

Respond with ONLY valid JSON in this exact shape, no markdown:
[{"name": "<track name>", "artistName": "<artist name>", "reason": "<short reason>"}]`;

  return callGemini(prompt, aiMoodResultSchema);
}

export async function generatePlaylistDraft(prompt: string): Promise<{
  name: string;
  description: string;
}> {
  const geminiPrompt = `You are a music playlist curator.
A user wrote this rough idea for a playlist: "${prompt}"

Create a concise playlist name (max 4 words, no quotes) and a short description (1-2 sentences, under 60 words) that captures the vibe.

Respond with ONLY valid JSON in this exact shape, no markdown:
{"name": "<playlist name>", "description": "<short description>"}`;

  return callGemini(geminiPrompt, playlistDraftResponseSchema);
}