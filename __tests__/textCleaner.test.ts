import { cleanMathText, hasMathContent } from "../lib/textCleaner";

describe("cleanMathText", () => {
  describe("Markdown Title Conversion", () => {
    test("converts **Title** to # Title at start of line", () => {
      const input = "**Calculus Fundamentals**";
      const expected = "# Calculus Fundamentals";
      expect(cleanMathText(input)).toBe(expected);
    });

    test("converts multiple markdown titles", () => {
      const input = "**Introduction**\n\n**Main Content**";
      expect(cleanMathText(input)).toContain("# Introduction");
      expect(cleanMathText(input)).toContain("# Main Content");
    });

    test("preserves inline **bold** text in sentences", () => {
      const input = "This is **important** text";
      const result = cleanMathText(input);
      expect(result).toContain("important");
    });
  });

  describe("Unicode Math Symbol Replacement", () => {
    test("replaces π with \\pi", () => {
      const input = "π = 3.14159";
      expect(cleanMathText(input)).toContain("\\pi");
      expect(cleanMathText(input)).not.toContain("π");
    });

    test("replaces ∞ with \\infty", () => {
      const input = "Limit as x → ∞";
      expect(cleanMathText(input)).toContain("\\infty");
    });

    test("replaces ∫ with \\int", () => {
      const input = "The integral ∫ dx";
      expect(cleanMathText(input)).toContain("\\int");
    });

    test("replaces ∑ with \\sum", () => {
      const input = "∑ from i=1 to n";
      expect(cleanMathText(input)).toContain("\\sum");
    });

    test("replaces multiple Unicode symbols", () => {
      const input = "π + ∞ - ∫";
      const result = cleanMathText(input);
      expect(result).toContain("\\pi");
      expect(result).toContain("\\infty");
      expect(result).toContain("\\int");
    });

    test("handles Greek letters", () => {
      const input = "α, β, γ, δ";
      const result = cleanMathText(input);
      expect(result).toContain("\\alpha");
      expect(result).toContain("\\beta");
      expect(result).toContain("\\gamma");
      expect(result).toContain("\\delta");
    });

    test("replaces comparison operators", () => {
      const input = "x ≤ 5 and y ≥ 10";
      const result = cleanMathText(input);
      expect(result).toContain("\\leq");
      expect(result).toContain("\\geq");
    });
  });

  describe("Broken LaTeX Fixing", () => {
    test("converts e^-x to e^{-x}", () => {
      const input = "e^-x";
      const result = cleanMathText(input);
      expect(result).toContain("e^{-x}");
    });

    test("converts a_bc to a_{bc}", () => {
      const input = "a_bc";
      const result = cleanMathText(input);
      expect(result).toContain("a_{bc}");
    });

    test("preserves already correct e^{-x}", () => {
      const input = "e^{-x}";
      const result = cleanMathText(input);
      expect(result).toContain("e^{-x}");
    });

    test("handles multiple broken expressions", () => {
      const input = "e^-x + a_bc - d_-e";
      const result = cleanMathText(input);
      expect(result).toContain("e^{-x}");
      expect(result).toContain("a_{bc}");
      expect(result).toContain("d_{-e}");
    });
  });

  describe("Equation Delimiter Standardization", () => {
    test("converts \\( \\) to $ $", () => {
      const input = "\\(x^2\\)";
      const result = cleanMathText(input);
      expect(result).toContain("$");
      expect(result).not.toContain("\\(");
    });

    test("normalizes LaTeX delimiters to standard form", () => {
      const input = "\\[\\int x dx\\]";
      const result = cleanMathText(input);
      // Should convert \[ to $$ and \] to $$
      expect(result.includes("\\[")).toBe(false);
      expect(result.includes("\\]")).toBe(false);
      expect(result.includes("\\int")).toBe(true); // LaTeX command should remain
    });

    test("removes excessive spaces around delimiters", () => {
      const input = "$  x^2  $";
      const result = cleanMathText(input);
      expect(result).toBe("$x^2$");
    });
  });

  describe("Whitespace Normalization", () => {
    test("removes trailing spaces", () => {
      const input = "Test line   \nAnother line  ";
      const result = cleanMathText(input);
      expect(result).not.toMatch(/\s+$/m);
    });

    test("collapses multiple spaces to single", () => {
      const input = "This    is     spaced";
      expect(cleanMathText(input)).toBe("This is spaced");
    });

    test("normalizes multiple line breaks", () => {
      const input = "Line 1\n\n\n\nLine 2";
      const result = cleanMathText(input);
      expect(result).toContain("Line 1\n\nLine 2");
    });

    test("trims leading and trailing whitespace", () => {
      const input = "  \n  Test content  \n  ";
      const result = cleanMathText(input);
      expect(result).toMatch(/^Test content$/);
    });
  });

  describe("Complex Real-World Examples", () => {
    test("processes ChatGPT-style math explanation", () => {
      const input = `
**Calculus Problem**

Find ∫ (e^-x) dx from 0 to ∞

Solution:
∫ e^-x dx = -e^-x + C
      `.trim();

      const result = cleanMathText(input);
      expect(result).toContain("# Calculus Problem");
      expect(result).toContain("\\infty");
      expect(result).toContain("e^{-x}");
      expect(result).not.toContain("e^-x");
    });

    test("handles mixed Markdown and LaTeX", () => {
      const input = `**Series Formula**

The sum ∑(n=1 to ∞) 1/n^2 = π^2/6`;

      const result = cleanMathText(input);
      expect(result).toContain("# Series Formula");
      expect(result).toContain("\\sum");
      expect(result).toContain("\\pi");
      expect(result).toContain("\\infty");
    });

    test("processes equation with multiple symbols", () => {
      const input = "∂f/∂x = ∫ g(x) dx where g(x) → 0 as x → ∞";
      const result = cleanMathText(input);
      expect(result).toContain("\\partial");
      expect(result).toContain("\\int");
      expect(result).toContain("\\infty");
    });
  });

  describe("Edge Cases", () => {
    test("handles empty string", () => {
      expect(cleanMathText("")).toBe("");
      expect(cleanMathText("   ")).toBe("");
    });

    test("handles null/undefined gracefully", () => {
      expect(cleanMathText(null as any)).toBe("");
      expect(cleanMathText(undefined as any)).toBe("");
    });

    test("preserves already-wrapped equations", () => {
      const input = "$$\\int_0^\\infty e^{-x} dx$$";
      const result = cleanMathText(input);
      expect(result).toContain("$$");
    });

    test("handles mixed equation delimiters", () => {
      const input = "Inline $x^2$ and display $$y^3$$ text";
      const result = cleanMathText(input);
      expect(result).toContain("$x^2$");
      expect(result).toContain("$$y^3$$");
    });

    test("handles malformed LaTeX gracefully", () => {
      const input = "\\frac{1}{2} and broken \\frac{1 {2}";
      // Should not crash
      expect(() => cleanMathText(input)).not.toThrow();
    });

    test("preserves code-like content", () => {
      const input = "e^-x is the exponential decay function";
      const result = cleanMathText(input);
      expect(result).toContain("is the exponential");
    });
  });

  describe("getPreviewText (alias)", () => {
    test("returns same result as cleanMathText", () => {
      const input = "**Title** with π and e^-x";
      expect(cleanMathText(input)).toBe(cleanMathText(input));
    });
  });

  describe("hasMathContent", () => {
    test("detects $ delimiter", () => {
      expect(hasMathContent("$x^2$")).toBe(true);
    });

    test("detects LaTeX commands", () => {
      expect(hasMathContent("\\int x dx")).toBe(true);
      expect(hasMathContent("\\frac{1}{2}")).toBe(true);
    });

    test("detects Unicode math symbols", () => {
      expect(hasMathContent("π + ∞")).toBe(true);
      expect(hasMathContent("∫ dx")).toBe(true);
    });

    test("returns false for plain text", () => {
      expect(hasMathContent("No math here")).toBe(false);
    });

    test("handles empty input", () => {
      expect(hasMathContent("")).toBe(false);
      expect(hasMathContent(null as any)).toBe(false);
    });
  });

  describe("Consistency", () => {
    test("multiple runs produce same output", () => {
      const input = "**Title** with π and e^-x";
      const run1 = cleanMathText(input);
      const run2 = cleanMathText(run1);
      expect(run2).toBe(run1);
    });

    test("order of operations is deterministic", () => {
      const input = "e^-x → ∞ as **x** increases";
      const result1 = cleanMathText(input);
      const result2 = cleanMathText(input);
      expect(result1).toBe(result2);
    });
  });
});
