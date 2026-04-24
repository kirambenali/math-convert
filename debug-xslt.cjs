const { Xslt, XmlParser, xmlTransformedText } = require('xslt-processor');
const fs = require('fs');
const temml = require('temml');

const xslText = fs.readFileSync('C:/Program Files/Microsoft Office/root/Office16/MML2OMML.XSL', 'utf-8');
const mathml = temml.renderToString('\\frac{a}{b}', { throwOnError: false, xml: true });

console.log('=== MathML ===');
console.log(mathml.slice(0, 600));

const parser = new XmlParser();
const xsltEngine = new Xslt();

const xslDoc = parser.xmlParse(xslText);
const xmlDoc = parser.xmlParse(mathml);

console.log('\n=== xslDoc root ===', xslDoc && xslDoc.documentElement ? xslDoc.documentElement.tagName : 'null');
console.log('=== xmlDoc root ===', xmlDoc && xmlDoc.documentElement ? xmlDoc.documentElement.tagName : 'null');

xsltEngine.xsltProcess(xmlDoc, xslDoc)
    .then(resultDoc => {
        const out = xmlTransformedText(resultDoc);
        console.log('\n=== OMML Output ===');
        console.log('Length:', out.length);
        console.log('Content:', out.slice(0, 500));
    })
    .catch(err => {
        console.error('\n=== ERROR ===', err);
    });
