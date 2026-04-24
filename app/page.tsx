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
      await convertAndDownload(input, "Devoir_Mathematiques.docx");
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

  const charCount = input.length;
  const wordCount = input
    .trim()
    .split(/\s+/)
    .filter((w) => w.length > 0).length;
  const hasMath = segments.some(s => s.type === "math-inline" || s.type === "math-block");

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f8fafc",
        backgroundImage: "radial-gradient(at 0% 0%, hsla(253,16%,95%,1) 0, transparent 50%), radial-gradient(at 50% 0%, hsla(225,39%,90%,1) 0, transparent 50%), radial-gradient(at 100% 0%, hsla(339,49%,90%,1) 0, transparent 50%)",
        backgroundAttachment: "fixed",
        fontFamily: "'Inter', system-ui, sans-serif",
        color: "#1e293b",
        padding: "2rem 1rem",
      }}
    >
      {/* Global Styles */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 8px; }
        ::-webkit-scrollbar-track { background: #f1f5f9; border-radius: 4px; }
        ::-webkit-scrollbar-thumb { background: #c4b5fd; border-radius: 4px; }
        ::-webkit-scrollbar-thumb:hover { background: #a78bfa; }
        textarea:focus { outline: none; }
        .katex { font-size: 1.1em !important; color: #1e293b !important; }
        .katex-display { margin: 0.5em 0 !important; }
      `}</style>

      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        {/* ── Header ── */}
        <div style={{ textAlign: "center", marginBottom: "3rem" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.6rem",
              background: "#ffffff",
              border: "1px solid #ddd6fe",
              borderRadius: "50px",
              padding: "0.4rem 1rem",
              marginBottom: "1rem",
              fontSize: "0.8rem",
              color: "#7c3aed",
              fontWeight: 600,
              boxShadow: "0 2px 4px rgba(124,58,237,0.05)",
            }}
          >
            <span>✦</span>
            <span>Math Convert</span>
            <span>✦</span>
          </div>

          <h1
            style={{
              fontSize: "clamp(2rem, 5vw, 2.8rem)",
              fontWeight: 800,
              margin: "0 0 0.5rem 0",
              backgroundImage: "linear-gradient(135deg, #7c3aed, #4f46e5)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              letterSpacing: "-0.02em",
            }}
          >
            LaTeX vers Word
          </h1>
          <p style={{ color: "#64748b", fontSize: "1.05rem", maxWidth: "500px", margin: "0 auto" }}>
            Un outil simple pour transformer vos textes mathématiques en documents Word professionnels.
          </p>
        </div>

        {/* ── Main Grid ── */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2rem", alignItems: "start" }}>

          {/* ── Left Column: Input ── */}
          <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "24px", padding: "1.5rem", boxShadow: "0 10px 30px -10px rgba(0,0,0,0.05)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "1.2rem" }}>
              <span style={{ fontSize: "1.2rem" }}>📝</span>
              <h2 style={{ fontSize: "1rem", fontWeight: 700, margin: 0, color: "#475569" }}>Texte source</h2>
            </div>

            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Collez votre texte ici (LaTeX, exercices...)"
              style={{
                width: "100%",
                height: "450px",
                padding: "1.2rem",
                background: "#f8fafc",
                border: "1px solid #e2e8f0",
                borderRadius: "16px",
                color: "#1e293b",
                fontSize: "0.95rem",
                fontFamily: "inherit",
                lineHeight: 1.6,
                resize: "vertical",
                transition: "all 0.2s",
              }}
              onFocus={(e) => {
                e.target.style.borderColor = "#c4b5fd";
                e.target.style.background = "#ffffff";
                e.target.style.boxShadow = "0 0 0 4px rgba(196,181,253,0.15)";
              }}
              onBlur={(e) => {
                e.target.style.borderColor = "#e2e8f0";
                e.target.style.background = "#f8fafc";
                e.target.style.boxShadow = "none";
              }}
            />

            <div style={{ display: "flex", gap: "1.2rem", marginTop: "1rem", fontSize: "0.75rem", color: "#94a3b8", fontWeight: 500 }}>
              <span>{wordCount} mots</span>
              <span>{charCount} caractères</span>
              {hasMath && <span style={{ color: "#10b981" }}>✓ Mathématiques détectées</span>}
            </div>

            <button
              onClick={handleGenerateWord}
              disabled={isLoading || !input.trim()}
              style={{
                width: "100%",
                marginTop: "1.5rem",
                padding: "1rem",
                background: isLoading ? "#94a3b8" : "linear-gradient(135deg, #7c3aed, #6d28d9)",
                color: "white",
                border: "none",
                borderRadius: "14px",
                fontSize: "1rem",
                fontWeight: 600,
                cursor: isLoading || !input.trim() ? "not-allowed" : "pointer",
                boxShadow: "0 4px 15px rgba(124,58,237,0.25)",
                transition: "all 0.2s",
              }}
            >
              {isLoading ? "Génération..." : "Télécharger en .docx"}
            </button>

            {error && (
              <div style={{ marginTop: "1rem", padding: "0.75rem", background: "#fef2f2", border: "1px solid #fee2e2", borderRadius: "10px", color: "#dc2626", fontSize: "0.85rem" }}>
                ⚠️ {error}
              </div>
            )}
            {success && (
              <div style={{ marginTop: "1rem", padding: "0.75rem", background: "#f0fdf4", border: "1px solid #dcfce7", borderRadius: "10px", color: "#16a34a", fontSize: "0.85rem" }}>
                ✅ Document généré avec succès !
              </div>
            )}
          </div>

          {/* ── Right Column: Preview ── */}
          <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "24px", padding: "1.5rem", boxShadow: "0 10px 30px -10px rgba(0,0,0,0.05)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "1.2rem" }}>
              <span style={{ fontSize: "1.2rem" }}>✨</span>
              <h2 style={{ fontSize: "1rem", fontWeight: 700, margin: 0, color: "#475569" }}>Aperçu</h2>
            </div>

            <div style={{ height: "450px", overflowY: "auto", background: "#fafafa", border: "1px solid #f1f5f9", borderRadius: "16px", padding: "1.5rem" }}>
              {segments.length > 0 ? (
                <PreviewRenderer segments={segments} />
              ) : (
                <div style={{ textAlign: "center", marginTop: "4rem", color: "#94a3b8" }}>
                  <p style={{ fontSize: "1.5rem", marginBottom: "1rem" }}>✍️</p>
                  <p style={{ fontStyle: "italic", fontSize: "0.9rem" }}>L&apos;aperçu apparaîtra ici au fur et à mesure...</p>
                </div>
              )}
            </div>

            <div style={{ marginTop: "1.5rem", padding: "1rem", background: "#f5f3ff", border: "1px solid #ede9fe", borderRadius: "12px", fontSize: "0.8rem", color: "#6d28d9" }}>
              <p style={{ margin: 0 }}><strong>Note :</strong> Les équations s&apos;afficheront dans Word avec la police <em>Cambria Math</em>.</p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

// ── Preview Components ───────────────────────────────────────────────────────

function PreviewRenderer({ segments }: { segments: ParsedSegment[] }) {
  const elements: React.ReactNode[] = [];
  let i = 0;
  let key = 0;

  while (i < segments.length) {
    const seg = segments[i];

    if (seg.type === "empty") {
      elements.push(<div key={key++} style={{ height: "0.8em" }} />);
      i++;
      continue;
    }

    if (seg.type === "heading") {
      const lvl = seg.level ?? 1;
      elements.push(
        <div key={key++} style={{ fontSize: lvl === 1 ? "1.3rem" : "1.1rem", fontWeight: 700, margin: "1.2rem 0 0.5rem", color: "#4c1d95", borderBottom: lvl === 1 ? "2px solid #ddd6fe" : "none", paddingBottom: "0.2rem" }}>
          {seg.content}
        </div>
      );
      i++;
      continue;
    }

    if (seg.type === "math-block") {
      elements.push(
        <div key={key++} style={{ margin: "1rem 0", textAlign: "center", padding: "0.5rem", background: "white", borderRadius: "8px", border: "1px solid #f1f5f9" }}>
          <MathBlock latex={seg.content} display={seg.display} />
        </div>
      );
      i++;
      continue;
    }

    if (seg.type === "text" || seg.type === "math-inline") {
      const runSegs: ParsedSegment[] = [];
      while (i < segments.length && (segments[i].type === "text" || segments[i].type === "math-inline")) {
        runSegs.push(segments[i++]);
      }
      elements.push(
        <p key={key++} style={{ margin: "0.5rem 0", lineHeight: 1.6 }}>
          {runSegs.map((s, idx) => (
            s.type === "math-inline"
              ? <MathInline key={idx} latex={s.content} display={s.display} bold={s.bold} />
              : <TextSegment key={idx} text={s.content} bold={s.bold} />
          ))}
        </p>
      );
      continue;
    }
    i++;
  }
  return <>{elements}</>;
}

function TextSegment({ text, bold }: { text: string; bold?: boolean }) {
  return <span style={{ fontWeight: bold ? 700 : 400 }}>{text}</span>;
}

function MathBlock({ latex, display }: { latex: string; display?: string }) {
  try {
    const html = katex.renderToString(latex, { displayMode: true, throwOnError: false, strict: "ignore" });
    return <div dangerouslySetInnerHTML={{ __html: html }} />;
  } catch {
    return <div style={{ color: "#ef4444" }}>{display ?? latex}</div>;
  }
}

function MathInline({ latex, display, bold }: { latex: string; display?: string; bold?: boolean }) {
  try {
    const html = katex.renderToString(latex, { displayMode: false, throwOnError: false, strict: "ignore" });
    return <span style={{ fontWeight: bold ? 700 : 400 }} dangerouslySetInnerHTML={{ __html: html }} />;
  } catch {
    return <span style={{ color: "#ef4444", fontWeight: bold ? 700 : 400 }}>{display ?? latex}</span>;
  }
}

function LoadingSpinner() {
  return (
    <div style={{ width: "16px", height: "16px", border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "white", borderRadius: "50%", animation: "spin 0.6s linear infinite" }} />
  );
}
