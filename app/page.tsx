"use client";

import { useState, useCallback, useEffect, ReactNode } from "react";
import katex from "katex";
import { convertAndDownload } from "@/lib/api";
import { parseInput, ParsedSegment } from "@/lib/parser";
import "katex/dist/katex.min.css";

export default function Home() {
  const [input, setInput] = useState("");
  const [segments, setSegments] = useState<ParsedSegment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Update preview as user types
  useEffect(() => {
    if (input.trim()) {
      try {
        const parsed = parseInput(input);
        setSegments(parsed);
        setError(null);
      } catch (err) {
        console.error("Erreur lors de l'analyse:", err);
        setError("Erreur lors du traitement du texte");
      }
    } else {
      setSegments([]);
    }
  }, [input]);

  const handleGenerateWord = useCallback(async () => {
    if (!input.trim()) {
      setError("Veuillez entrer du texte");
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccess(false);

    try {
      await convertAndDownload(input, "mathematiques.docx");
      setSuccess(true);
      setTimeout(() => setSuccess(false), 4000);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Échec de la génération du document";
      setError(message);
      console.error("Erreur de conversion:", err);
    } finally {
      setIsLoading(false);
    }
  }, [input]);

  useEffect(() => {
    setSuccess(false);
  }, [input]);

  const charCount = input.length;
  const hasMath = segments.some(s => s.type === "math-inline" || s.type === "math-block");
  const wordCount = input
    .trim()
    .split(/\s+/)
    .filter((w) => w.length > 0).length;
  const mathBlockCount = segments.filter((s) => s.type === "math-block").length;
  const mathInlineCount = segments.filter((s) => s.type === "math-inline").length;

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)",
        fontFamily: "'Inter', system-ui, sans-serif",
        color: "#e0e0e0",
        padding: "2rem 1rem",
      }}
    >
      {/* Google Fonts */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 8px; }
        ::-webkit-scrollbar-track { background: rgba(255,255,255,0.05); border-radius: 4px; }
        ::-webkit-scrollbar-thumb { background: rgba(139,92,246,0.5); border-radius: 4px; }
        ::-webkit-scrollbar-thumb:hover { background: rgba(139,92,246,0.8); }
        textarea:focus { outline: none; }
        .katex { font-size: 1.1em !important; }
        .katex-display { margin: 0.5em 0 !important; }
      `}</style>

      <div style={{ maxWidth: "1400px", margin: "0 auto" }}>
        {/* ── Header ── */}
        <div style={{ textAlign: "center", marginBottom: "2.5rem" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.75rem",
              background: "rgba(139,92,246,0.15)",
              border: "1px solid rgba(139,92,246,0.3)",
              borderRadius: "50px",
              padding: "0.4rem 1.2rem",
              marginBottom: "1rem",
              fontSize: "0.85rem",
              color: "#a78bfa",
              letterSpacing: "0.05em",
              textTransform: "uppercase",
            }}
          >
            <span>✦</span>
            <span>Séries Mathématiques</span>
            <span>✦</span>
          </div>

          <h1
            style={{
              fontSize: "clamp(1.8rem, 4vw, 3rem)",
              fontWeight: 700,
              margin: "0 0 0.75rem 0",
              background: "linear-gradient(135deg, #c4b5fd, #818cf8, #38bdf8)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              lineHeight: 1.2,
            }}
          >
            Convertisseur LaTeX → Word
          </h1>
          <p
            style={{
              color: "#94a3b8",
              fontSize: "1.05rem",
              maxWidth: "600px",
              margin: "0 auto",
            }}
          >
            Collez votre texte copié de ChatGPT ou DeepSeek — les équations
            mathématiques seront converties et intégrées proprement dans un fichier Word.
          </p>
        </div>

        {/* ── Main Grid ── */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "1.5rem",
            alignItems: "start",
          }}
        >
          {/* ── Input Panel ── */}
          <div
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "16px",
              padding: "1.5rem",
              backdropFilter: "blur(10px)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.6rem",
                marginBottom: "1rem",
              }}
            >
              <span style={{ fontSize: "1.3rem" }}>📋</span>
              <h2
                style={{
                  fontSize: "1.15rem",
                  fontWeight: 600,
                  margin: 0,
                  color: "#c4b5fd",
                }}
              >
                Texte brut (ChatGPT / DeepSeek)
              </h2>
            </div>

            <textarea
              id="input-textarea"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={`Collez ici votre texte copié depuis ChatGPT ou DeepSeek...\n\nExemple :\nLe plan P est rapporté à un repère orthonormé direct (O, u⃗, v⃗).\nSoit A,B et C les points du plan d'affixes respectives i, 1+i et −1+i.\nz′=iz+2z−i\n(z−i)(z′−i)=1`}
              style={{
                width: "100%",
                height: "420px",
                padding: "1rem",
                background: "rgba(0,0,0,0.35)",
                border: "1px solid rgba(139,92,246,0.25)",
                borderRadius: "10px",
                color: "#e2e8f0",
                fontSize: "0.88rem",
                fontFamily: "'JetBrains Mono', monospace",
                lineHeight: 1.7,
                resize: "vertical",
                transition: "border-color 0.2s",
              }}
              onFocus={(e) =>
                (e.target.style.borderColor = "rgba(139,92,246,0.6)")
              }
              onBlur={(e) =>
                (e.target.style.borderColor = "rgba(139,92,246,0.25)")
              }
            />

            {/* Stats */}
            <div
              style={{
                display: "flex",
                gap: "1rem",
                flexWrap: "wrap",
                marginTop: "0.75rem",
                fontSize: "0.8rem",
                color: "#64748b",
              }}
            >
              <span>
                <strong style={{ color: "#94a3b8" }}>{wordCount}</strong> mots
              </span>
              <span>
                <strong style={{ color: "#94a3b8" }}>{charCount}</strong> caractères
              </span>
              {hasMath && (
                <>
                  <span style={{ color: "#34d399" }}>
                    ✓ {mathBlockCount} équation(s) bloc
                  </span>
                  {mathInlineCount > 0 && (
                    <span style={{ color: "#34d399" }}>
                      ✓ {mathInlineCount} équation(s) inline
                    </span>
                  )}
                </>
              )}
            </div>

            {/* Generate Button */}
            <button
              id="generate-word-btn"
              onClick={handleGenerateWord}
              disabled={isLoading || !input.trim()}
              style={{
                width: "100%",
                marginTop: "1rem",
                padding: "0.9rem 1.5rem",
                background:
                  isLoading || !input.trim()
                    ? "rgba(100,100,120,0.4)"
                    : "linear-gradient(135deg, #7c3aed, #4f46e5)",
                border: "none",
                borderRadius: "10px",
                color: isLoading || !input.trim() ? "#64748b" : "#fff",
                fontSize: "1rem",
                fontWeight: 600,
                cursor: isLoading || !input.trim() ? "not-allowed" : "pointer",
                transition: "all 0.2s",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.6rem",
                boxShadow:
                  isLoading || !input.trim()
                    ? "none"
                    : "0 4px 20px rgba(124,58,237,0.35)",
              }}
            >
              {isLoading ? (
                <>
                  <SpinnerIcon />
                  Génération en cours…
                </>
              ) : (
                <>
                  <span>📥</span>
                  Générer le fichier Word
                </>
              )}
            </button>

            {/* Status Messages */}
            {error && (
              <div
                style={{
                  marginTop: "0.75rem",
                  padding: "0.75rem 1rem",
                  background: "rgba(239,68,68,0.1)",
                  border: "1px solid rgba(239,68,68,0.3)",
                  borderRadius: "8px",
                  color: "#fca5a5",
                  fontSize: "0.88rem",
                }}
              >
                <strong>Erreur :</strong> {error}
              </div>
            )}

            {success && (
              <div
                style={{
                  marginTop: "0.75rem",
                  padding: "0.75rem 1rem",
                  background: "rgba(52,211,153,0.1)",
                  border: "1px solid rgba(52,211,153,0.3)",
                  borderRadius: "8px",
                  color: "#6ee7b7",
                  fontSize: "0.88rem",
                }}
              >
                ✓ Document Word généré et téléchargé avec succès !
              </div>
            )}
          </div>

          {/* ── Preview Panel ── */}
          <div
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "16px",
              padding: "1.5rem",
              backdropFilter: "blur(10px)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.6rem",
                marginBottom: "1rem",
              }}
            >
              <span style={{ fontSize: "1.3rem" }}>👁️</span>
              <h2
                style={{
                  fontSize: "1.15rem",
                  fontWeight: 600,
                  margin: 0,
                  color: "#38bdf8",
                }}
              >
                Prévisualisation rendue
              </h2>
            </div>

            <div
              style={{
                overflowY: "auto",
                height: "420px",
                background: "rgba(0,0,0,0.25)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: "10px",
                padding: "1.25rem",
              }}
            >
              {segments.length > 0 ? (
                <PreviewRenderer segments={segments} />
              ) : (
                <p
                  style={{
                    color: "#475569",
                    fontStyle: "italic",
                    textAlign: "center",
                    marginTop: "3rem",
                  }}
                >
                  L&apos;aperçu du texte formaté avec les équations mathématiques
                  s&apos;affichera ici…
                </p>
              )}
            </div>

            {/* Info box */}
            <div
              style={{
                marginTop: "1rem",
                padding: "1rem",
                background: "rgba(56,189,248,0.07)",
                border: "1px solid rgba(56,189,248,0.2)",
                borderRadius: "10px",
                fontSize: "0.82rem",
                color: "#7dd3fc",
              }}
            >
              <strong style={{ color: "#38bdf8", display: "block", marginBottom: "0.5rem" }}>
                ℹ️ Ce que fait l&apos;outil :
              </strong>
              <ul style={{ margin: 0, paddingLeft: "1.2rem", lineHeight: 1.8 }}>
                <li>✓ Détecte automatiquement les équations (Unicode, LaTeX, mixte)</li>
                <li>✓ Reconnaît les symboles : π, ∑, ∫, ≠, z′, →, ζ, ℝ…</li>
                <li>✓ Convertit les titres <code>**Titre**</code> en vrais titres</li>
                <li>✓ Insère les équations en MathML dans le fichier Word</li>
                <li>✓ Résultat lisible directement dans Microsoft Word</li>
              </ul>
            </div>
          </div>
        </div>

        {/* ── Features Section ── */}
        <div
          style={{
            marginTop: "2rem",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "1rem",
          }}
        >
          {[
            {
              icon: "∑",
              title: "Équations LaTeX",
              desc: "\\frac{}, \\int, \\sum, \\sqrt{}, \\vec{}, \\cdot",
            },
            {
              icon: "π",
              title: "Symboles Unicode",
              desc: "π, ∑, ∫, ≠, ≤, ≥, →, ⇒, ζ, ℝ, ℂ…",
            },
            {
              icon: "#",
              title: "Titres Markdown",
              desc: "**Titre** converti en titre Word stylisé",
            },
            {
              icon: "📐",
              title: "Mode bloc & inline",
              desc: "Équations centrées ou insérées dans le texte",
            },
            {
              icon: "📄",
              title: "Export Word natif",
              desc: "MathML dans .docx — équations éditables",
            },
            {
              icon: "⚡",
              title: "Traitement local",
              desc: "Instantané, déterministe, sans serveur IA",
            },
          ].map((f, idx) => (
            <div
              key={idx}
              style={{
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.07)",
                borderRadius: "12px",
                padding: "1rem 1.2rem",
                transition: "border-color 0.2s, background 0.2s",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLDivElement).style.background =
                  "rgba(139,92,246,0.08)";
                (e.currentTarget as HTMLDivElement).style.borderColor =
                  "rgba(139,92,246,0.3)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLDivElement).style.background =
                  "rgba(255,255,255,0.03)";
                (e.currentTarget as HTMLDivElement).style.borderColor =
                  "rgba(255,255,255,0.07)";
              }}
            >
              <div
                style={{
                  fontSize: "1.5rem",
                  marginBottom: "0.4rem",
                  color: "#a78bfa",
                  fontFamily: "'JetBrains Mono', monospace",
                }}
              >
                {f.icon}
              </div>
              <p
                style={{
                  fontWeight: 600,
                  margin: "0 0 0.25rem 0",
                  color: "#c4b5fd",
                  fontSize: "0.92rem",
                }}
              >
                {f.title}
              </p>
              <p style={{ margin: 0, color: "#64748b", fontSize: "0.8rem" }}>
                {f.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Spinner ─────────────────────────────────────────────────────────────────

function SpinnerIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ animation: "spin 1s linear infinite" }}
    >
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      <line x1="12" y1="2" x2="12" y2="6" />
      <line x1="12" y1="18" x2="12" y2="22" />
      <line x1="4.93" y1="4.93" x2="7.76" y2="7.76" />
      <line x1="16.24" y1="16.24" x2="19.07" y2="19.07" />
      <line x1="2" y1="12" x2="6" y2="12" />
      <line x1="18" y1="12" x2="22" y2="12" />
      <line x1="4.93" y1="19.07" x2="7.76" y2="16.24" />
      <line x1="16.24" y1="7.76" x2="19.07" y2="4.93" />
    </svg>
  );
}

// ── Preview Renderer ─────────────────────────────────────────────────────────

function PreviewRenderer({ segments }: { segments: ParsedSegment[] }) {
  const elements: React.ReactNode[] = [];

  // Group consecutive text/inline-math into paragraphs
  let i = 0;
  let key = 0;

  while (i < segments.length) {
    const seg = segments[i];

    if (seg.type === "empty") {
      elements.push(<div key={key++} style={{ height: "0.6em" }} />);
      i++;
      continue;
    }

    if (seg.type === "heading") {
      const sizes: Record<number, string> = {
        1: "1.4rem",
        2: "1.2rem",
        3: "1.05rem",
      };
      const lvl = seg.level ?? 1;
      elements.push(
        <div
          key={key++}
          style={{
            fontSize: sizes[lvl] ?? "1rem",
            fontWeight: 700,
            margin: "1.2em 0 0.4em",
            color: "#c4b5fd",
            borderBottom: lvl === 1 ? "1px solid rgba(196,181,253,0.2)" : "none",
            paddingBottom: lvl === 1 ? "0.3em" : "0",
          }}
        >
          {seg.content}
        </div>
      );
      i++;
      continue;
    }

    if (seg.type === "math-block") {
      elements.push(
        <div
          key={key++}
          style={{
            background: "rgba(255,255,255,0.03)",
            borderRadius: "8px",
            padding: "1rem",
            margin: "0.8em 0",
            overflowX: "auto",
            textAlign: "center",
          }}
        >
          <MathBlock latex={seg.content} display={seg.display} />
        </div>
      );
      i++;
      continue;
    }

    // Text / inline math — collect into one paragraph
    if (seg.type === "text" || seg.type === "math-inline") {
      const runSegs: ParsedSegment[] = [];
      while (
        i < segments.length &&
        (segments[i].type === "text" || segments[i].type === "math-inline")
      ) {
        runSegs.push(segments[i]);
        i++;
      }
      elements.push(
        <p
          key={key++}
          style={{
            margin: "0.35em 0",
            lineHeight: 1.75,
            color: "#cbd5e1",
            fontSize: "0.95rem",
          }}
        >
          {runSegs.map((s, idx) =>
            s.type === "math-inline" ? (
              <MathInline key={idx} latex={s.content} display={s.display} />
            ) : (
              <TextSegment key={idx} text={s.content} />
            )
          )}
        </p>
      );
      continue;
    }

    i++;
  }

  return <>{elements}</>;
}

function TextSegment({ text }: { text: string }) {
  // Handle **bold**
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return (
    <>
      {parts.map((p, i) =>
        p.startsWith("**") && p.endsWith("**") ? (
          <strong key={i} style={{ color: "#e2e8f0" }}>
            {p.slice(2, -2)}
          </strong>
        ) : (
          <span key={i}>{p}</span>
        )
      )}
    </>
  );
}

function MathBlock({ latex, display }: { latex: string; display?: string }) {
  try {
    const html = katex.renderToString(latex, {
      displayMode: true,
      throwOnError: false,
      strict: "ignore",
    });
    return <div dangerouslySetInnerHTML={{ __html: html }} />;
  } catch (err) {
    return (
      <div
        style={{
          fontFamily: "'Cambria Math', 'Cambria', serif",
          fontSize: "1.15em",
          color: "#e2e8f0",
          textAlign: "center",
          padding: "0.5em 0",
          whiteSpace: "pre-wrap",
        }}
      >
        {display ?? latex}
      </div>
    );
  }
}

function MathInline({ latex, display }: { latex: string; display?: string }) {
  try {
    const html = katex.renderToString(latex, {
      displayMode: false,
      throwOnError: false,
      strict: "ignore",
    });
    return <span dangerouslySetInnerHTML={{ __html: html }} />;
  } catch (err) {
    return (
      <span
        style={{
          fontFamily: "'Cambria Math', 'Cambria', serif",
          fontSize: "1.05em",
          color: "#e2e8f0",
          padding: "0 0.1em",
          whiteSpace: "pre-wrap",
        }}
      >
        {display ?? latex}
      </span>
    );
  }
}


