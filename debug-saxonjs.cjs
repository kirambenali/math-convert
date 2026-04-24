const SaxonJS = require('saxon-js');
const temml = require('temml');
const path = require('path');

const mathml = temml.renderToString('\\frac{a}{b} + \\sqrt{c}', { throwOnError: false, xml: true });
console.log('MathML:', mathml.slice(0, 300));

const sefPath = path.join(__dirname, 'public', 'MML2OMML.sef.json');

SaxonJS.transform({
    stylesheetFileName: sefPath,
    sourceText: mathml,
    destination: 'serialized'
}, 'async').then(output => {
    console.log('\n=== OMML Output ===');
    console.log('Length:', output.principalResult ? output.principalResult.length : 0);
    console.log(output.principalResult ? output.principalResult.slice(0, 500) : 'EMPTY');
}).catch(err => {
    console.error('ERROR:', err.message || err);
});
