import path from "path";
import temml from "temml";
import SaxonJS from "saxon-js";
import AdmZip from "adm-zip";
import { DOMParser, XMLSerializer } from "@xmldom/xmldom";
import { ParsedSegment } from "./parser";

const W = "http://schemas.openxmlformats.org/wordprocessingml/2006/main";
const M = "http://schemas.openxmlformats.org/officeDocument/2006/math";
const SEF = path.join(process.cwd(), "public", "MML2OMML.sef.json");

function elW(doc: Document, l: string) { return doc.createElementNS(W, `w:${l}`); }
function wT(doc: Document, v: string) { const t = elW(doc, "t"); t.setAttributeNS("http://www.w3.org/XML/1998/namespace", "xml:space", "preserve"); t.textContent = v; return t; }
function wR(doc: Document, b: boolean, f?: string) { const p = elW(doc, "rPr"); if (b) p.appendChild(elW(doc, "b")); if (f) { const n = elW(doc, "rFonts"); n.setAttributeNS(W, "w:ascii", f); n.setAttributeNS(W, "w:hAnsi", f); p.appendChild(n); } return p; }

async function t2o(latex: string, display: boolean) {
  try {
    let cl = latex.replace(/[‘’]/g, "'").replace(/[“”]/g, '"');
    const acc: Record<string, string> = { "é": "\\text{é}", "è": "\\text{è}", "à": "\\text{à}", "ù": "\\text{ù}", "â": "\\text{â}", "ê": "\\text{ê}", "î": "\\text{î}", "ô": "\\text{ô}", "û": "\\text{û}", "ë": "\\text{ë}", "ï": "\\text{ï}", "ü": "\\text{ü}", "ç": "\\text{ç}", "œ": "\\text{œ}" };
    for (const [u, l] of Object.entries(acc)) cl = cl.split(u).join(l);
    let m = temml.renderToString(cl, { displayMode: display, xml: true, strict: false });
    if (!m.includes('xmlns=')) m = m.replace("<math", '<math xmlns="http://www.w3.org/1998/Math/MathML"');
    const r = await SaxonJS.transform({ stylesheetFileName: SEF, sourceText: m, destination: "serialized" }, "async");
    return { omml: r.principalResult || null, fallback: latex };
  } catch (e) { return { omml: null, fallback: latex }; }
}

function inj(target: Document, parent: Element, omml: string) {
  try {
    const d = new DOMParser().parseFromString(`<root xmlns:m="${M}" xmlns:w="${W}">${omml}</root>`, "text/xml");
    if (d.documentElement) Array.from(d.documentElement.childNodes).forEach(c => parent.appendChild(target.adoptNode(c as any)));
    return true;
  } catch (e) { return false; }
}

async function mkP(doc: Document, segs: ParsedSegment[]) {
  const p = elW(doc, "p"), pr = elW(doc, "pPr"), sp = elW(doc, "spacing"); sp.setAttributeNS(W, "w:after", "120"); pr.appendChild(sp); p.appendChild(pr);
  for (const s of segs) {
    if (s.type === "text") {
      s.content.split(/(\*\*[^*]+\*\*)/g).forEach(pt => {
        if (!pt) return; const b = pt.startsWith("**") && pt.endsWith("**"), r = elW(doc, "r");
        r.appendChild(wR(doc, b)); r.appendChild(wT(doc, b ? pt.slice(2, -2) : pt)); p.appendChild(r);
      });
    } else if (s.type === "math-inline") {
      const o = await t2o(s.content, false);
      if (o.omml && inj(doc, p, o.omml)) continue;
      const r = elW(doc, "r"), rPr = wR(doc, false, "Cambria Math"); rPr.appendChild(elW(doc, "i")); r.appendChild(rPr); r.appendChild(wT(doc, o.fallback)); p.appendChild(r);
    }
  }
  return p;
}

export async function generateDocx(segs: ParsedSegment[]) {
  const dom = new DOMParser(), ser = new XMLSerializer(), sk = `<?xml version="1.0" encoding="UTF-8"?><w:document xmlns:w="${W}" xmlns:m="${M}"><w:body/></w:document>`;
  const doc = dom.parseFromString(sk, "text/xml") as unknown as Document, body = doc.getElementsByTagNameNS(W, "body")[0] as unknown as Element;
  let i = 0;
  while (i < segs.length) {
    const s = segs[i];
    if (s.type === "heading") {
      const p = elW(doc, "p"), pr = elW(doc, "pPr"), st = elW(doc, "pStyle"); st.setAttributeNS(W, "w:val", `Heading${s.level || 1}`); pr.appendChild(st); p.appendChild(pr);
      const r = elW(doc, "r"); r.appendChild(wT(doc, s.content)); p.appendChild(r); body.appendChild(p); i++;
    } else if (s.type === "math-block") {
      const o = await t2o(s.content, true); const p = elW(doc, "p");
      if (o.omml && inj(doc, p, o.omml)) body.appendChild(p); else { const r = elW(doc, "r"); r.appendChild(wT(doc, o.fallback)); p.appendChild(r); body.appendChild(p); }
      i++;
    } else if (s.type === "text" || s.type === "math-inline") {
      const r: ParsedSegment[] = []; while (i < segs.length && (segs[i].type === "text" || segs[i].type === "math-inline")) r.push(segs[i++]);
      if (r.length > 0) body.appendChild(await mkP(doc, r));
    } else i++;
  }
  const zip = new AdmZip();
  zip.addFile("word/document.xml", Buffer.from(ser.serializeToString(doc as any), "utf-8"));
  zip.addFile("[Content_Types].xml", Buffer.from(`<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>`, "utf-8"));
  zip.addFile("_rels/.rels", Buffer.from(`<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>`, "utf-8"));
  zip.addFile("word/_rels/document.xml.rels", Buffer.from(`<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/settings" Target="settings.xml"/></Relationships>`, "utf-8"));
  zip.addFile("word/styles.xml", Buffer.from(`<?xml version="1.0" encoding="UTF-8"?><w:styles xmlns:w="${W}"><w:docDefaults><w:rPrDefault><w:rPr><w:sz w:val="24"/></w:rPr></w:rPrDefault></w:docDefaults><w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/></w:style><w:style w:type="paragraph" w:styleId="Heading1"><w:name w:val="heading 1"/><w:pPr><w:outlineLvl w:val="0"/></w:pPr><w:rPr><w:b/><w:sz w:val="36"/></w:rPr></w:style></w:styles>`, "utf-8"));
  zip.addFile("word/settings.xml", Buffer.from(`<?xml version="1.0" encoding="UTF-8"?><w:settings xmlns:w="${W}" xmlns:m="${M}"><m:mathPr><m:mathFont m:val="Cambria Math"/><m:defJc m:val="centerGroup"/></m:mathPr></w:settings>`, "utf-8"));
  return zip.toBuffer();
}
