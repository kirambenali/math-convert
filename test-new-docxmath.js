const { convertToDocxMath } = require('./lib/docxMath');
const latex = '\\frac{a}{b} + \\sqrt{c}';
try {
    const result = convertToDocxMath(latex);
    console.log("Success! Result children count:", result.root[0].root.length);
} catch (e) {
    console.error("Error:", e);
}
