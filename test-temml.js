const t = require('temml');
const out = t.renderToString('\\frac{iz+2}{z-i}', {displayMode:true, throwOnError:false});
console.log(out.substring(0,800));
console.log('\n---\n');
const out2 = t.renderToString('z^{\\prime} = \\frac{iz+2}{z-i}', {displayMode:true, throwOnError:false});
console.log(out2.substring(0,800));
