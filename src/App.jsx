import { useState, useMemo, useCallback } from "react";
import { Copy, Check, CircleNotch } from "@phosphor-icons/react";

function wordCount(text) {
  const trimmed = text.trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).length;
}

export default function App() {
  const [inputText, setInputText] = useState("");
  const [outputText, setOutputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const inputWords = useMemo(() => wordCount(inputText), [inputText]);
  const outputWords = useMemo(() => wordCount(outputText), [outputText]);
  const canRewrite = inputText.trim().length > 0 && !isLoading;

  const handleRewrite = useCallback(async () => {
    if (!canRewrite) return;
    setIsLoading(true);
    setError("");
    try {
      const res = await fetch("/api/rewrite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: inputText }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || "Something went wrong. Try again.");
      }
      setOutputText(data.result || "");
    } catch (err) {
      setError(err.message || "Something went wrong. Try again.");
    } finally {
      setIsLoading(false);
    }
  }, [inputText, canRewrite]);

  const handleCopy = useCallback(async () => {
    if (!outputText) return;
    try {
      await navigator.clipboard.writeText(outputText);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setError("Couldn't copy to clipboard.");
    }
  }, [outputText]);

  return (
    <div className="flex min-h-[100dvh] flex-col bg-zinc-950">
      <header className="flex items-center justify-between border-b border-zinc-800 px-6 py-4">
        <h1 className="text-sm font-medium tracking-tight text-zinc-100">
          Rewrite
        </h1>
        <button
          type="button"
          onClick={handleRewrite}
          disabled={!canRewrite}
          className="inline-flex items-center gap-2 rounded-md bg-amber-400 px-4 py-2 text-sm font-medium text-zinc-950 transition-colors duration-150 hover:bg-amber-300 disabled:cursor-not-allowed disabled:bg-zinc-800 disabled:text-zinc-500"
        >
          {isLoading && (
            <CircleNotch size={16} weight="bold" className="animate-spin" />
          )}
          {isLoading ? "Rewriting" : "Rewrite"}
        </button>
      </header>

      <main className="grid flex-1 grid-cols-1 gap-px bg-zinc-800 lg:grid-cols-2">
        <section className="flex flex-col bg-zinc-950 px-6 py-5">
          <label
            htmlFor="input"
            className="mb-3 text-xs uppercase tracking-wide text-zinc-500"
          >
            Original
          </label>
          <textarea
            id="input"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Paste your text here"
            className="min-h-[40vh] flex-1 resize-none bg-transparent text-[15px] leading-relaxed text-zinc-100 placeholder-zinc-600 outline-none lg:min-h-0"
          />
          <div className="mt-3 text-xs text-zinc-600">
            {inputWords} {inputWords === 1 ? "word" : "words"}
          </div>
        </section>

        <section className="flex flex-col bg-zinc-950 px-6 py-5">
          <div className="mb-3 flex items-center justify-between">
            <label
              htmlFor="output"
              className="text-xs uppercase tracking-wide text-zinc-500"
            >
              Rewritten
            </label>
            {outputText && (
              <button
                type="button"
                onClick={handleCopy}
                className="inline-flex items-center gap-1.5 text-xs text-zinc-400 transition-colors duration-150 hover:text-zinc-100"
              >
                {copied ? (
                  <>
                    <Check size={14} weight="bold" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy size={14} weight="bold" />
                    Copy
                  </>
                )}
              </button>
            )}
          </div>
          <textarea
            id="output"
            readOnly
            value={outputText}
            placeholder={
              isLoading ? "Rewriting..." : "Your rewrite will show up here"
            }
            className="min-h-[40vh] flex-1 resize-none bg-transparent text-[15px] leading-relaxed text-zinc-100 placeholder-zinc-600 outline-none lg:min-h-0"
          />
          <div className="mt-3 text-xs text-zinc-600">
            {outputWords} {outputWords === 1 ? "word" : "words"}
          </div>
        </section>
      </main>

      {error && (
        <div className="border-t border-zinc-800 px-6 py-3 text-sm text-red-400">
          {error}
        </div>
      )}
    </div>
  );
}
