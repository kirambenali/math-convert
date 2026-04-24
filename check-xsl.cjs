const fs = require('fs');
const txt = fs.readFileSync('C:/Program Files/Microsoft Office/root/Office16/MML2OMML.XSL', 'utf-8');
const m = txt.match(/version=["']([^"']+)["']/);
console.log('version:', m ? m[1] : 'not found');
console.log('has analyze-string:', txt.includes('analyze-string'));
console.log('has xsl:function:', txt.includes('xsl:function'));
console.log('first 500 chars:', txt.slice(0, 500));
