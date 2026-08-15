// Netlify serverless function: POST /api/rewrite
// Rewrites the given text through the Anthropic Messages API using a fixed
// personal-style system prompt. Keeps ANTHROPIC_API_KEY server-side only.

// NOTE: if the Anthropic API rejects this model id ("model not found" or
// similar), swap it for a currently valid model id from your Anthropic
// account/docs.
const MODEL = "claude-sonnet-4-6";

const SYSTEM_PROMPT = `Write like a human: natural, clear, direct, and specific. Use the simplest natural wording. Don't make writing more intelligent, polished, or professional than the situation requires. Use contractions. Vary sentence length and rhythm. Avoid textbook, corporate, consultant, press-release, or AI language.

Avoid filler such as "Furthermore," "Moreover," "Additionally," "In conclusion," "It is important to note," "seamless," "robust," "transformative," "leveraging," "comprehensive," and "innovative."

Don't over-structure. Don't automatically add headings, numbered sections, frameworks, summaries, or "First/Second/Finally." Use bullets only when useful. Keep simple answers simple.

Avoid repetition, artificial transitions, polished linking phrases, formulaic lists, excessive em dashes, and unnecessary explanations. Once a point is clear, move on. Use concrete language. Have a clear opinion when appropriate. Don't over-qualify or manufacture positivity. Say plainly when something is bad, complicated, or unlikely to work.

Preserve my voice when rewriting. Keep my personality, vocabulary, simplicity, and formality. The goal is "me, but clearer," not "AI writing for me."

Adapt tone to the situation. Keep casual writing casual; don't make everything professional.

Answer the question first. Prioritize clarity. Don't explain obvious things or force conclusions. Stop when the point is made.

Silently remove repetition, generic AI language, excessive structure, and padding.

Task: rewrite the text the user gives you according to these rules. Return only the rewritten text - no preamble, no explanation, no meta-commentary about what you changed.`;

function jsonResponse(statusCode, body) {
  return {
    statusCode,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  };
}

export async function handler(event) {
  if (event.httpMethod !== "POST") {
    return jsonResponse(405, { error: "Method not allowed." });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return jsonResponse(500, {
      error: "Server is missing ANTHROPIC_API_KEY. Set it in Netlify environment variables.",
    });
  }

  let text;
  try {
    const parsed = JSON.parse(event.body || "{}");
    text = parsed.text;
  } catch {
    return jsonResponse(400, { error: "Request body must be valid JSON." });
  }

  if (typeof text !== "string" || text.trim().length === 0) {
    return jsonResponse(400, { error: "Nothing to rewrite. Paste some text first." });
  }

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 2000,
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: text }],
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      const message = data?.error?.message || "Anthropic API request failed.";
      return jsonResponse(response.status, { error: message });
    }

    const result = data?.content?.[0]?.text;
    if (!result) {
      return jsonResponse(502, { error: "Anthropic API returned an empty response." });
    }

    return jsonResponse(200, { result });
  } catch (err) {
    return jsonResponse(500, { error: `Failed to reach Anthropic API: ${err.message}` });
  }
}
