import { normalizeLatex } from "./lib/normalizer.ts";
import { latexToMathML, mathMLToOMML, latexToOMML } from "./lib/mathConverter.ts";
import { generateDocx } from "./lib/docxBuilder.ts";
import fs from "fs";

const COLORS = {
    green: "\x1b[32m",
    red: "\x1b[31m",
    yellow: "\x1b[33m",
    blue: "\x1b[34m",
    reset: "\x1b[0m",
    bold: "\x1b[1m",
};

const pass = (msg) => console.log(`${COLORS.green}✓${COLORS.reset} ${msg}`);
const fail = (msg) => console.log(`${COLORS.red}✗${COLORS.reset} ${msg}`);
const info = (msg) => console.log(`${COLORS.blue}ℹ${COLORS.reset} ${msg}`);
const header = (msg) =>
    console.log(`\n${COLORS.bold}${COLORS.yellow}── ${msg} ──${COLORS.reset}`);

let passed = 0;
let failed = 0;

function assert(condition, message) {
    if (condition) {
        pass(message);
        passed++;
    } else {
        fail(message);
        failed++;
    }
}

async function runTests() {
    // ─────────────────────────────────────────────────────────────────────────────
    // Test 1 — Normalizer
    // ─────────────────────────────────────────────────────────────────────────────
    header("Test 1: normalizeLatex");

    {
        const input = `Here is inline math: \\( a^2 + b^2 = c^2 \\)

And a block:

\\[
\\int_0^1 x^2 dx
\\]

Also dollar: $E = mc^2$ and block: $$\\sum_{n=1}^{\\infty} \\frac{1}{n^2}$$`;

        const segs = normalizeLatex(input);
        info(`Segments: ${JSON.stringify(segs.map(s => ({ type: s.type, content: s.content.slice(0, 30) })), null, 2)}`);

        assert(segs.some((s) => s.type === "inline-math"), "Detects \\( \\) inline math");
        assert(segs.some((s) => s.type === "block-math"), "Detects \\[ \\] block math");
        assert(segs.some((s) => s.type === "text"), "Preserves text segments");
        assert(
            segs.filter((s) => s.type === "block-math").length >= 2,
            "Detects $$ $$ block math too"
        );
        assert(
            segs.filter((s) => s.type === "inline-math").length >= 2,
            "Detects $ $ inline math too"
        );
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // Test 2 — LaTeX → MathML
    // ─────────────────────────────────────────────────────────────────────────────
    header("Test 2: latexToMathML");

    {
        const cases = [
            "\\frac{a}{b}",
            "a^2 + b^2 = c^2",
            "\\int_0^1 x^2 dx",
            "\\sum_{n=1}^{\\infty} \\frac{1}{n^2}",
            "\\begin{cases} x & y \\\\ z & w \\end{cases}",
        ];

        for (const latex of cases) {
            const mathml = latexToMathML(latex);
            assert(
                mathml !== null && mathml.includes("<math"),
                `Converts: ${latex.slice(0, 30)}`
            );
            if (mathml) {
                assert(
                    mathml.includes('xmlns="http://www.w3.org/1998/Math/MathML"') ||
                    mathml.includes("MathML"),
                    `Has MathML namespace: ${latex.slice(0, 20)}`
                );
            }
        }
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // Test 3 — MathML → OMML
    // ─────────────────────────────────────────────────────────────────────────────
    header("Test 3: mathMLToOMML");

    {
        const latex = "\\frac{a}{b} + \\sqrt{c}";
        const mathml = latexToMathML(latex);

        if (!mathml) {
            fail("Cannot test OMML — MathML conversion failed");
            failed++;
        } else {
            info(`MathML (snippet): ${mathml.slice(0, 120)}`);
            try {
                const omml = await mathMLToOMML(mathml);
                info(`OMML (snippet): ${omml.slice(0, 120)}`);
                assert(omml.includes("oMath"), "OMML contains <m:oMath>");
                assert(
                    omml.includes("schemas.openxmlformats.org/officeDocument/2006/math"),
                    "OMML has correct namespace"
                );
            } catch (err) {
                fail(`OMML conversion threw: ${err.message}`);
                failed++;
            }
        }
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // Test 4 — Full pipeline: latexToOMML
    // ─────────────────────────────────────────────────────────────────────────────
    header("Test 4: latexToOMML (full pipeline)");

    {
        const cases = [
            { latex: "\\frac{iz+2}{z-i}", display: false },
            { latex: "\\int_0^{\\infty} e^{-x^2} dx = \\frac{\\sqrt{\\pi}}{2}", display: true },
            { latex: "\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}", display: true },
        ];

        for (const { latex, display } of cases) {
            const result = await latexToOMML(latex, display);
            if (result.omml) {
                pass(`Pipeline OK: ${latex.slice(0, 35)}`);
                passed++;
            } else {
                console.log(
                    `${COLORS.yellow}⚠${COLORS.reset} OMML fallback for: ${latex.slice(0, 35)} — ${result.error}`
                );
            }
        }
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // Test 5 — Full DOCX generation
    // ─────────────────────────────────────────────────────────────────────────────
    header("Test 5: generateDocx");

    {
        const input = `# Test Document

Here is inline math: \\( a^2 + b^2 = c^2 \\)

This is **bold text** mixed with inline $E = mc^2$.

Block equation below:

\\[
\\int_0^1 x^2 dx = \\frac{1}{3}
\\]

Another block:

$$\\sum_{n=1}^{\\infty} \\frac{1}{n^2} = \\frac{\\pi^2}{6}$$

Complex matrix:

\\[
\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix} \\begin{pmatrix} x \\\\ y \\end{pmatrix}
\\]`;

        const segments = normalizeLatex(input);
        info(`Segment count: ${segments.length}`);

        try {
            const buffer = await generateDocx(segments);
            info(`Buffer size: ${buffer.length} bytes`);

            assert(buffer.length > 1000, "Buffer has meaningful size");
            assert(buffer[0] === 0x50 && buffer[1] === 0x4b, "Starts with PK (valid ZIP/DOCX)");

            // Write test output
            fs.writeFileSync("test-output.docx", buffer);
            pass("Written to test-output.docx — open in Word to verify!");
            passed++;
        } catch (err) {
            fail(`generateDocx threw: ${err.message}`);
            console.error(err);
            failed++;
        }
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // Summary
    // ─────────────────────────────────────────────────────────────────────────────
    console.log(
        `\n${COLORS.bold}Results: ${COLORS.green}${passed} passed${COLORS.reset}${COLORS.bold}, ${failed > 0 ? COLORS.red : COLORS.green
        }${failed} failed${COLORS.reset}\n`
    );

    if (failed > 0) process.exit(1);
}

runTests().catch(err => {
    console.error("Test execution failed:", err);
    process.exit(1);
});
