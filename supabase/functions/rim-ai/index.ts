// 99RIM AI: picks the rhymes that fit a lyric line and suggests ways to finish it.
//
// The app finds rhymes itself, from pronunciations (rhyme.js). Claude only chooses among
// those candidates, so it can't invent words that don't rhyme. It may add a few phrases
// that end on a candidate word.
//
// Deploy: supabase functions deploy rim-ai
// Secret:  supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
// Optional: RIM_MODEL (default claude-opus-5-5), ALLOWED_ORIGIN (default *)

import Anthropic from "npm:@anthropic-ai/sdk@0.133.0";
import { betaZodOutputFormat } from "npm:@anthropic-ai/sdk@0.133.0/helpers/beta/zod";
import { z } from "npm:zod@4.6.6";

const MODEL = Deno.env.get("RIM_MODEL") || "claude-opus-5-5";
const ORIGIN = Deno.env.get("ALLOWED_ORIGIN") || "*";
const client = new Anthropic(); // reads ANTHROPIC_API_KEY

const cors = {
  "Access-Control-Allow-Origin": ORIGIN,
  "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });

const Input = z.object({
  line: z.string().trim().min(1).max(300),
  lang: z.enum(["da", "en"]).default("da"),
  // Rhymes the app already found for the line's last word, best first.
  candidates: z.array(z.string().trim().min(1).max(40)).min(1).max(150),
});

const Output = z.object({
  picks: z.array(z.object({
    word: z.string().describe("A candidate word, or a short phrase ending in one"),
    why: z.string().describe("Max 12 words: why it fits the line"),
  })).describe("The 8-12 best fits, best first"),
  lines: z.array(z.string()).describe("3 suggested next lines that end in one of the picks"),
});

const SYSTEM = {
  da: `Du hjælper danske sangskrivere og rappere med rim. Du får en linje og en liste af ord, der rimer på linjens sidste ord.
Vælg de 8-12 ord, der passer bedst til linjens betydning, stemning og rytme. Brug kun ord fra listen, eller korte, naturlige danske vendinger der slutter på et ord fra listen (fx "i mit hjerte").
Foretræk almindelige ord frem for navne og sjældne ord, og flerstavelsesrim frem for enstavelsesrim.
Skriv derefter 3 forslag til en næste linje, der matcher linjens stil og længde og slutter på et af dine valg.
Svar på dansk.`,
  en: `You help songwriters and rappers find rhymes. You get a line and a list of words that rhyme with its last word.
Pick the 8-12 words that best fit the line's meaning, mood and rhythm. Only use words from the list, or short natural phrases ending in a word from the list.
Prefer common words over names and rare words, and multi-syllable rhymes over single-syllable ones.
Then write 3 suggestions for a next line that match the line's style and length and end on one of your picks.`,
};

// Best effort: each running instance allows 20 requests per minute per IP.
const hits = new Map<string, number[]>();
function limited(ip: string) {
  const now = Date.now();
  const recent = (hits.get(ip) || []).filter((t) => now - t < 60_000);
  recent.push(now);
  hits.set(ip, recent);
  return recent.length > 20;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "POST only" }, 405);
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() || "?";
  if (limited(ip)) return json({ error: "rate_limited" }, 429);

  const parsed = Input.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return json({ error: "bad_request" }, 400);
  const { line, lang, candidates } = parsed.data;

  try {
    const res = await client.beta.messages.parse({
      model: MODEL,
      max_tokens: 4000,
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      output_config: { effort: "low", format: betaZodOutputFormat(Output) },
      system: SYSTEM[lang],
      messages: [{ role: "user", content: `Linje: ${line}\n\nRim: ${candidates.join(", ")}` }],
    });
    if (res.stop_reason === "refusal" || !res.parsed_output) return json({ error: "no_answer" }, 502);
    return json(res.parsed_output);
  } catch (e) {
    if (e instanceof Anthropic.RateLimitError) return json({ error: "busy" }, 503);
    if (e instanceof Anthropic.APIError) return json({ error: "ai_error", status: e.status }, 502);
    return json({ error: "ai_unreachable" }, 502);
  }
});
