const t = require('temml');
const latex = `
f(x) = 
\\begin{cases} 
\\frac{\\sqrt{x}-1}{4}, & \\text{si } x \\ge 2 \\\\
\\frac{12}{ax}, & \\text{si } -4 < x < 1 \\\\
\\frac{x - 4}{bx^2}, & \\text{si } x \\le -4 
\\end{cases}
`;
try {
    const out = t.renderToString(latex, { displayMode: true, throwOnError: false });
    console.log(out);
} catch (e) {
    console.log("Error:", e);
}
