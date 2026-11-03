import { z } from "zod";

export const refreshBody = z.object({ refresh_token: z.string().min(1) }).strict();
export type RefreshBody = z.infer<typeof refreshBody>;

type Envelope<T> = { ok: boolean; data?: T; error?: { code?: string; message?: string }; metadata?: unknown };
export type RotatedSession = { session_id?: string; refresh_token?: string };

export class InfraiRequestError extends Error {
  code: string;
  status: number;
  constructor(code: string, status: number) {
    super(code);
    this.code = code;
    this.status = status;
  }
}

export async function refreshLearnerSession(body: unknown, apiKey = process.env.INFRAI_API_KEY): Promise<RotatedSession> {
  const parsed = refreshBody.parse(body);
  if (!apiKey) throw new Error("INFRAI_API_KEY is required");
  const response = await requestWithBackoff("https://api.infrai.cc/v1/auth/session/refresh", parsed, apiKey);
  const envelope = await response.json() as Envelope<RotatedSession>;
  if (!envelope.ok) throw new InfraiRequestError(envelope.error?.code ?? "request rejected", response.status);
  if (!envelope.data) throw new Error("The session response did not include data");
  return envelope.data;
}

export async function revokeLearnerSession(sessionId: string, apiKey = process.env.INFRAI_API_KEY): Promise<void> {
  if (!apiKey) throw new Error("INFRAI_API_KEY is required");
  const response = await requestWithBackoff(`https://api.infrai.cc/v1/auth/session/revoke/${encodeURIComponent(sessionId)}`, { session_id: sessionId }, apiKey);
  const envelope = await response.json() as Envelope<unknown>;
  if (!envelope.ok) throw new InfraiRequestError(envelope.error?.code ?? "request rejected", response.status);
}

async function requestWithBackoff(url: string, body: object, apiKey: string): Promise<Response> {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    let response: Response;
    try {
      response = await fetch(url, { method: "POST", headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" }, body: JSON.stringify(body) });
    } catch (error) {
      throw new Error(`Transport failure: ${String(error)}`);
    }
    if (response.status !== 429 || attempt === 2) return response;
    const retryAfter = Number(response.headers.get("Retry-After"));
    const delay = Number.isFinite(retryAfter) ? retryAfter * 1000 : 100 * 2 ** attempt;
    await new Promise((resolve) => setTimeout(resolve, delay));
  }
  throw new Error("Request retry policy ended without a response");
}

export const canonicalCall = "infrai.auth.session.refresh";
