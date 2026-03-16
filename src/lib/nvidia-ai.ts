const NVIDIA_URL = "https://integrate.api.nvidia.com/v1/chat/completions";
const NVIDIA_MODEL = "qwen/qwen3.5-122b-a10b";

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const OPENROUTER_MODEL = "minimax/minimax-m2.5:free";

interface AiMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface AiResponse {
  ok: boolean;
  text: string;
  error?: string;
  provider?: "nvidia" | "openrouter";
}

async function callNvidia(
  messages: AiMessage[],
  opts?: { maxTokens?: number; temperature?: number },
): Promise<AiResponse> {
  const apiKey = process.env.NVIDIA_API_KEY;
  if (!apiKey)
    return { ok: false, text: "", error: "NVIDIA_API_KEY not configured" };

  const res = await fetch(NVIDIA_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      model: NVIDIA_MODEL,
      messages,
      max_tokens: opts?.maxTokens ?? 4096,
      temperature: opts?.temperature ?? 0.5,
      top_p: 0.89,
      stream: false,
      chat_template_kwargs: { enable_thinking: false },
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    return {
      ok: false,
      text: "",
      error: `NVIDIA API ${res.status}: ${errText}`,
    };
  }

  const data = await res.json();
  const text = data.choices?.[0]?.message?.content ?? "";
  return { ok: true, text: text.trim(), provider: "nvidia" };
}

async function callOpenRouter(
  messages: AiMessage[],
  opts?: { maxTokens?: number; temperature?: number },
): Promise<AiResponse> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey)
    return { ok: false, text: "", error: "OPENROUTER_API_KEY not configured" };

  const res = await fetch(OPENROUTER_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: OPENROUTER_MODEL,
      messages,
      max_tokens: opts?.maxTokens ?? 4096,
      temperature: opts?.temperature ?? 0.5,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    return {
      ok: false,
      text: "",
      error: `OpenRouter API ${res.status}: ${errText}`,
    };
  }

  const data = await res.json();
  const text = data.choices?.[0]?.message?.content ?? "";
  return { ok: true, text: text.trim(), provider: "openrouter" };
}

export async function callNvidiaAi(
  messages: AiMessage[],
  opts?: { maxTokens?: number; temperature?: number },
): Promise<AiResponse> {
  try {
    const primary = await callNvidia(messages, opts);
    if (primary.ok) return primary;

    // Fallback to OpenRouter
    console.warn(
      `[AI] NVIDIA failed: ${primary.error}. Trying OpenRouter fallback...`,
    );
    const fallback = await callOpenRouter(messages, opts);
    if (fallback.ok) return fallback;

    return {
      ok: false,
      text: "",
      error: `Both providers failed. NVIDIA: ${primary.error} | OpenRouter: ${fallback.error}`,
    };
  } catch (err) {
    // Try fallback on network error too
    try {
      const fallback = await callOpenRouter(messages, opts);
      if (fallback.ok) return fallback;
    } catch {
      /* ignore */
    }

    return {
      ok: false,
      text: "",
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}
