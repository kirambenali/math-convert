export interface ParsedSegment {
  type: "text" | "heading" | "math-inline" | "math-block" | "empty";
  level?: 1 | 2 | 3;
  content: string;
  display?: string;
  bold?: boolean;
}

const U2L: Record<string, string> = {
  "π": "\\pi", "Π": "\\Pi", "α": "\\alpha", "β": "\\beta", "γ": "\\gamma", "Γ": "\\Gamma",
  "δ": "\\delta", "Δ": "\\Delta", "∆": "\\Delta", "ε": "\\varepsilon", "ζ": "\\zeta",
  "η": "\\eta", "θ": "\\theta", "Θ": "\\Theta", "λ": "\\lambda", "Λ": "\\Lambda",
  "μ": "\\mu", "ν": "\\nu", "ξ": "\\xi", "Ξ": "\\Xi", "ρ": "\\rho", "σ": "\\sigma",
  "Σ": "\\Sigma", "τ": "\\tau", "φ": "\\varphi", "ϕ": "\\phi", "χ": "\\chi",
  "ψ": "\\psi", "Ψ": "\\Psi", "ω": "\\omega", "Ω": "\\Omega",
  "∞": "\\infty", "∫": "\\int", "∬": "\\iint", "∭": "\\iiint", "∮": "\\oint",
  "∑": "\\sum", "∏": "\\prod", "√": "\\sqrt",
  "±": "\\pm", "∓": "\\mp", "×": "\\times", "÷": "\\div", "·": "\\cdot",
  "≤": "\\leq", "≥": "\\geq", "≠": "\\neq", "≈": "\\approx", "∼": "\\sim",
  "≡": "\\equiv", "∝": "\\propto", "≪": "\\ll", "≫": "\\gg",
  "\u2212": "-", "∈": "\\in", "∉": "\\notin", "⊆": "\\subseteq", "⊂": "\\subset",
  "⊇": "\\supseteq", "⊃": "\\supset", "∪": "\\cup", "∩": "\\cap",
  "∅": "\\emptyset", "∀": "\\forall", "∃": "\\exists", "∂": "\\partial", "∇": "\\nabla",
  "→": "\\to", "←": "\\leftarrow", "↔": "\\leftrightarrow", "⇒": "\\Rightarrow",
  "⇔": "\\Leftrightarrow", "↦": "\\mapsto", "∣": "|", "∥": "\\parallel", "⊥": "\\perp",
  "∠": "\\angle", "°": "^{\\circ}", "ℝ": "\\mathbb{R}", "ℂ": "\\mathbb{C}",
  "ℤ": "\\mathbb{Z}", "ℕ": "\\mathbb{N}", "ℚ": "\\mathbb{Q}", "…": "\\ldots",
  "⟨": "\\langle", "⟩": "\\rangle", "\u20d7": "\\vec{}", "*": "\\ast"
};

const SUP: Record<string, string> = { "⁰": "0", "¹": "1", "²": "2", "³": "3", "⁴": "4", "⁵": "5", "⁶": "6", "⁷": "7", "⁸": "8", "⁹": "9", "ⁿ": "n", "ⁱ": "i", "⁺": "+", "⁻": "-", "ᵃ": "a", "ᵇ": "b", "ᶜ": "c", "ᵈ": "d", "ᵉ": "e" };
const SUB: Record<string, string> = { "₀": "0", "₁": "1", "₂": "2", "₃": "3", "₄": "4", "₅": "5", "₆": "6", "₇": "7", "₈": "8", "₉": "9", "ₙ": "n", "ₐ": "a", "ₑ": "e", "ᵢ": "i", "ⱼ": "j", "ₖ": "k", "ₘ": "m", "ₒ": "o", "ₚ": "p", "ᵣ": "r", "ₛ": "s", "ₜ": "t", "ᵤ": "u", "ᵥ": "v", "ₓ": "x" };
const FP = /\b(le|la|les|de|du|des|et|un|une|est|sont|que|qui|tel|tels|sur|dans|avec|pour|comme|donc|aussi|soit|soient|tout|tous|au|aux|ce|se|sa|son|ses|il|elle|ils|elles|on|nous|vous|où|ni|si|afin|chez|vers|sous|après|avant|entre|lors|dont|or|car|mais|ou|par|au|aux|point|points|plan|repère|cercle|triangle|milieu|droite|demi|ensemble|mesure|distance|rectangle|privée|lorsque|montrer|déduire|déterminer|calculer|placer|construire|trouver|vérifier|démontrer|donner|exprimer|écrire|noter|rappeler|associer|déduisons|montrons|posons|soient|étant|alors|ensuite|ainsi|enfin|respectivement|orthonormé|affixe|projeté|orthogonal|annexe|jointe|figure|bienvenu|complexe|suivant|premier|deuxième|troisième|quatrième|centre|rayon|image)\b/i;

export function unicodeToLatex(raw: string): string {
  let s = raw.replace(/([A-Za-z])\s*\n\s*([A-Za-z])\s*\n\s*→/g, "$1$2\u20d7").replace(/\n/g, " ");
  s = s.replace(/([A-Za-z])\u20d7/g, "\\vec{$1}").replace(/([A-Za-z])⃗/g, "\\vec{$1}");
  s = s.replace(/([A-Za-z0-9\}])″/g, "$1^{\\prime\\prime}").replace(/([A-Za-z0-9\}])′/g, "$1^{\\prime}").replace(/′/g, "^{\\prime}");
  s = s.replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹ⁿⁱ⁺⁻ᵃᵇᶜᵈᵉ]+/g, (m) => `^{${Array.from(m).map(c => SUP[c] ?? c).join("")}}`);
  s = s.replace(/[₀₁₂₃₄₅₆₇₈₉ₙₐₑᵢⱼₖₘₒₚᵣₛₜᵤᵥₓ]+/g, (m) => `_{${Array.from(m).map(c => SUB[c] ?? c).join("")}}`);
  for (const [u, l] of Object.entries(U2L)) { s = s.split(u).join(l); }
  const acc: Record<string, string> = { "é": "\\text{é}", "è": "\\text{è}", "à": "\\text{à}", "ù": "\\text{ù}", "â": "\\text{â}", "ê": "\\text{ê}", "î": "\\text{î}", "ô": "\\text{ô}", "û": "\\text{û}", "ë": "\\text{ë}", "ï": "\\text{ï}", "ü": "\\text{ü}", "ç": "\\text{ç}", "œ": "\\text{œ}" };
  for (const [u, l] of Object.entries(acc)) { s = s.split(u).join(l); }
  s = s.replace(/\^-([A-Za-z\d\\{])/g, "^{-$1}").replace(/_-([A-Za-z\d\\{])/g, "_{-$1}").replace(/\^([A-Za-z\d]{2,}(?![{]))/g, "^{$1}").replace(/_([A-Za-z\d]{2,}(?![{]))/g, "_{$1}");
  return s.split("\u2212").join("-");
}

function l2d(latex: string): string {
  let s = latex.replace(/\\overrightarrow\{([^}]*)\}/g, "$1\u20D7").replace(/\\vec\{([^}]*)\}/g, "$1\u20D7").replace(/\\frac\{([^{}]*)\}\{([^{}]*)\}/g, "($1)/($2)").replace(/\\sqrt\[(\d+)\]\{([^}]*)\}/g, "$1√($2)").replace(/\\sqrt\{([^}]*)\}/g, "√($1)").replace(/\\overline\{([^}]*)\}/g, "$1\u0305").replace(/\^\{([^}]+)\}/g, "^($1)").replace(/_\{([^}]+)\}/g, "_($1)");
  s = s.replace(/\\left\(/g, "(").replace(/\\right\)/g, ")").replace(/\\left\[/g, "[").replace(/\\right\]/g, "]").replace(/\\left\{/g, "{").replace(/\\right\}/g, "}").replace(/\\left\|/g, "|").replace(/\\right\|/g, "|");
  const CM: Record<string, string> = { "\\pi": "π", "\\Pi": "Π", "\\infty": "∞", "\\int": "∫", "\\sum": "∑", "\\prod": "∏", "\\pm": "±", "\\mp": "∓", "\\leq": "≤", "\\geq": "≥", "\\neq": "≠", "\\approx": "≈", "\\sim": "∼", "\\equiv": "≡", "\\Delta": "Δ", "\\delta": "δ", "\\alpha": "α", "\\beta": "β", "\\gamma": "γ", "\\mathbb{R}": "ℝ", "\\mathbb{C}": "ℂ", "\\mathbb{Z}": "ℤ", "\\mathbb{N}": "ℕ", "\\mathbb{Q}": "ℚ", "\\lim": "lim" };
  for (const [l, u] of Object.entries(CM)) { s = s.split(l).join(u); }
  return s.replace(/\\([a-zA-Z]+)/g, "$1").replace(/\{([^{}]*)\}/g, "$1").trim();
}

function addTextSegment(res: ParsedSegment[], text: string, bold: boolean = false) {
  if (!text) return;
  if (res.length > 0 && res[res.length - 1].type === "text" && !!res[res.length - 1].bold === bold) {
    res[res.length - 1].content += text;
  } else {
    res.push({ type: "text", content: text, bold });
  }
}

export function parseInput(raw: string): ParsedSegment[] {
  let s = raw.replace(/\\ast\\ast/g, "**").replace(/\\\*/g, "*").replace(/\\{2}\(/g, "\\(").replace(/\\{2}\)/g, "\\)").replace(/\\{2}\[/g, "\\[").replace(/\\{2}\]/g, "\\]");
  s = s.replace(/[\u200B-\u200F\u2061\uFEFF\u00A0]/g, " ").replace(/[\u2018\u2019\u201A\u201B]/g, "'").replace(/[\u201C\u201D\u201E\u201F]/g, '"').replace(/\u2026/g, "\\dots");
  s = s.replace(/\r\n/g, "\n").replace(/\n{3,}/g, "\n\n");
  s = s.replace(/\\li\s*\\?lim\b/gi, "\\lim ").replace(/\\inf\s*ty\b/gi, "\\infty ").replace(/\bin\s*f\s*ty\b/gi, "\\infty ");
  s = s.replace(/\\\[/g, "$$").replace(/\\\]/g, "$$").replace(/\\\(/g, "$").replace(/\\\)/g, "$");

  const ph: ParsedSegment[] = [], bh = new Set<number>();
  
  let pt = s;
  pt = pt.replace(/\$\$([\s\S]+?)\$\$/g, (_, c) => { 
    const idx = ph.length, l = unicodeToLatex(c.trim()); 
    ph.push({ type: "math-block", content: l, display: l2d(l) }); 
    return `§MB${idx}§`; 
  });
  pt = pt.replace(/\$([\s\S]+?)\$/g, (_, c) => { 
    const idx = ph.length, l = unicodeToLatex(c.trim()); 
    ph.push({ type: "math-inline", content: l, display: l2d(l) }); 
    return `§MI${idx}§`; 
  });

  pt = pt.replace(/(\*\*|\\ast\\ast)([\s\S]*?)(\*\*|\\ast\\ast)/g, (match, open, content, close, offset, full) => {
    const idx = ph.length; 
    ph.push({ type: "text", content: content });
    const ls = full.lastIndexOf("\n", offset - 1) + 1;
    const le = full.indexOf("\n", offset + match.length);
    const lc = full.slice(ls, le === -1 ? full.length : le).trim();
    if (lc === match.trim() && content.trim().length > 2 && (!FP.test(content.replace(/§M[BI]\d+§/g, "")) || /^Exercice/i.test(content.trim()))) {
      bh.add(idx);
      return `§B${idx}§`;
    }
    return `§BOLD${idx}§`; 
  });

  const mh = new Map<string, { level: 1 | 2 | 3; content: string }>();
  pt = pt.replace(/^(#{1,3})[ \t]+(.+)$/gm, (f, h, t) => { 
    const k = `§H${mh.size}§`; 
    mh.set(k.trim(), { level: Math.min(h.length, 3) as 1|2|3, content: t.trim() }); 
    return k; 
  });

  const res: ParsedSegment[] = [];
  pt.split("\n").forEach(l => {
    const t = l.trim(); 
    if (!t || /^([-*_])\1{2,}$/.test(t)) {
      if (!t) res.push({ type: "empty", content: "" });
      return;
    }
    if (mh.has(t)) { 
      const h = mh.get(t)!; 
      res.push({ type: "heading", level: h.level, content: h.content }); 
      return; 
    }
    const blm = t.match(/^§B(\d+)§$/);
    if (blm && bh.has(parseInt(blm[1]))) { 
      const idx = parseInt(blm[1]);
      const content = ph[idx].content.replace(/§MI\d+§/g, (m) => {
        const mix = parseInt(m.match(/\d+/)![0]);
        return ph[mix].content; 
      }).trim();
      res.push({ type: "heading", level: 2, content }); 
      return; 
    }

    const rx = /(§(?:MB|MI|B|BOLD|H)\d+§)|([\u0370-\u03ff\u2100-\u214f\u2200-\u22ff\u2190-\u21ff\u2a00-\u2aff\u27c0-\u27ef⁰¹²³⁴⁵⁶⁷⁸⁹ⁿⁱ⁺⁻ᵃᵇᶜᵈᵉ₀₁₂₃₄₅₆₇₈₉ₙₐₑᵢⱼₖₘₒₚᵣₛₜᵤᵥₓ′″=+\-<>!\u2212^]{1,})|(\\[a-zA-Z]+(?:\{[^{}]*\}|)*)/g;
    let li = 0, m;
    while ((m = rx.exec(l)) !== null) {
      if (m.index > li) addTextSegment(res, l.slice(li, m.index));
      const tk = m[0], pm = tk.match(/^§(MB|MI|B|BOLD|H)(\d+)§$/);
      if (pm) {
        if (pm[1] === "H") res.push({ type: "heading", ...mh.get(tk)! });
        else if (pm[1] === "BOLD") {
           const idx = parseInt(pm[2]);
           const content = ph[idx].content;
           const brx = /(§MI\d+§)/g;
           let bli = 0, bm;
           while ((bm = brx.exec(content)) !== null) {
              if (bm.index > bli) addTextSegment(res, content.slice(bli, bm.index), true);
              const btk = bm[0], bidx = parseInt(btk.match(/\d+/)![0]);
              res.push({ ...ph[bidx], bold: true });
              bli = brx.lastIndex;
           }
           if (bli < content.length) addTextSegment(res, content.slice(bli), true);
        } else {
           res.push(ph[parseInt(pm[2])]);
        }
      } else { 
        const lx = unicodeToLatex(tk); 
        res.push({ type: "math-inline", content: lx, display: l2d(lx) }); 
      }
      li = rx.lastIndex;
    }
    if (li < l.length) addTextSegment(res, l.slice(li));
  });
  return res;
}
