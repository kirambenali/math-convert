import path from "path";
import temml from "temml";
import SaxonJS from "saxon-js";
import AdmZip from "adm-zip";
import { DOMParser, XMLSerializer } from "@xmldom/xmldom";
import { ParsedSegment } from "./parser";

const W = "http://schemas.openxmlformats.org/wordprocessingml/2006/main";
const M = "http://schemas.openxmlformats.org/officeDocument/2006/math";
const R = "http://schemas.openxmlformats.org/officeDocument/2006/relationships";
const SEF = path.join(process.cwd(), "public", "MML2OMML.sef.json");

function elW(doc: Document, tag: string) {
  return doc.createElementNS(W, `w:${tag}`);
}

function wT(doc: Document, value: string) {
  const t = elW(doc, "t");
  t.setAttributeNS("http://www.w3.org/XML/1998/namespace", "xml:space", "preserve");
  t.textContent = value;
  return t;
}

function wRPr(doc: Document, bold: boolean, font?: string, size?: string) {
  const rPr = elW(doc, "rPr");
  if (bold) rPr.appendChild(elW(doc, "b"));
  if (size) {
    const sz = elW(doc, "sz"); sz.setAttributeNS(W, "w:val", size);
    const szCs = elW(doc, "szCs"); szCs.setAttributeNS(W, "w:val", size);
    rPr.appendChild(sz); rPr.appendChild(szCs);
  }
  if (font) {
    const rFonts = elW(doc, "rFonts");
    rFonts.setAttributeNS(W, "w:ascii", font);
    rFonts.setAttributeNS(W, "w:hAnsi", font);
    rPr.appendChild(rFonts);
  }
  return rPr;
}

async function latexToOMML(latex: string, display: boolean) {
  try {
    let cleanLatex = latex
      .replace(/[‘’]/g, "'")
      .replace(/[“”]/g, '"')
      .replace(/′/g, "^{\\prime}")
      .replace(/″/g, "^{\\prime\\prime}");

    // Normalize systems of equations
    cleanLatex = cleanLatex
      .replace(/\\begin\{cases\*?\}/g, "\\left\\{ \\begin{matrix}")
      .replace(/\\end\{cases\*?\}/g, "\\end{matrix} \\right.");

    const accents: Record<string, string> = {
      "é": "\\text{é}", "è": "\\text{è}", "à": "\\text{à}", "ù": "\\text{ù}", "â": "\\text{â}",
      "ê": "\\text{ê}", "î": "\\text{î}", "ô": "\\text{ô}", "û": "\\text{û}", "ë": "\\text{ë}",
      "ï": "\\text{ï}", "ü": "\\text{ü}", "ç": "\\text{ç}", "œ": "\\text{œ}"
    };
    for (const [u, l] of Object.entries(accents)) cleanLatex = cleanLatex.split(u).join(l);

    // Convert LaTeX to MathML using Temml
    let mathml = temml.renderToString(cleanLatex, { displayMode: display, xml: true, strict: false });
    
    // PRE-PROCESS MATHML: Force <mfenced> for systems
    // MML2OMML.XSL is an old converter that relies heavily on <mfenced> for fences.
    try {
      const mmlParser = new DOMParser();
      const mmlDoc = mmlParser.parseFromString(mathml, "application/xml");
      const mrows = Array.from(mmlDoc.getElementsByTagName("mrow"));
      mrows.forEach(mrow => {
        const mo = mrow.getElementsByTagName("mo")[0];
        if (mo && mo.textContent?.trim() === "{" && !mrow.getElementsByTagName("mfenced").length) {
          const mfenced = mmlDoc.createElement("mfenced");
          mfenced.setAttribute("open", "{");
          mfenced.setAttribute("close", "");
          const children = Array.from(mrow.childNodes);
          children.forEach(c => { if (c !== mo) mfenced.appendChild(c as any); });
          while (mrow.firstChild) mrow.removeChild(mrow.firstChild);
          mrow.appendChild(mfenced as any);
        }
      });
      mathml = new XMLSerializer().serializeToString(mmlDoc);
    } catch (e) { console.warn("MathML pre-process failed:", e); }

    if (!mathml.includes("xmlns=")) {
      mathml = mathml.replace("<math", '<math xmlns="http://www.w3.org/1998/Math/MathML"');
    }

    // Convert MathML to OMML using SaxonJS
    const transform = await SaxonJS.transform({
      stylesheetFileName: SEF,
      sourceText: mathml,
      destination: "serialized"
    }, "async");

    let result = (transform.principalResult as string) || "";
    // Clean up XML declaration and any extra whitespace
    result = result.replace(/<\?xml[^>]*\?>/gi, "").replace(/<!DOCTYPE[^>]*>/gi, "").trim();

    // POST-PROCESS OMML: Final repair of structural braces
    result = fixSystemBraces(result);

    // Increase math size to 14pt (w:sz val="28")
    const mathSize = "28"; 
    const rPr = `<m:rPr><w:sz w:val="${mathSize}"/><w:szCs w:val="${mathSize}"/></m:rPr>`;
    // Inject rPr safely only into m:r tags
    result = result.replace(/<m:r>/g, `<m:r>${rPr}`);

    if (display && result.includes("<m:oMath") && !result.includes("<m:oMathPara")) {
      result = `<m:oMathPara xmlns:m="${M}" xmlns:w="${W}">${result}</m:oMathPara>`;
    }

    return { omml: result, fallback: latex };
  } catch (e) {
    console.error("OMML Conversion Error:", e);
    return { omml: null, fallback: latex };
  }
}

/**
 * Repairs OMML where a brace '{' is a separate run instead of a delimiter.
 * Uses a robust, namespace-aware DOM approach.
 */
function fixSystemBraces(omml: string): string {
  try {
    const parser = new DOMParser();
    const snippet = `<root xmlns:m="${M}" xmlns:w="${W}">${omml}</root>`;
    const doc = parser.parseFromString(snippet, "text/xml");
    
    // Find all potential brace runs (m:r containing '{')
    const runs = Array.from(doc.getElementsByTagNameNS(M, "r"));
    runs.forEach(run => {
      const text = run.textContent?.trim();
      if (text === "{") {
        let next: any = run.nextSibling;
        while (next && next.nodeType !== 1) next = next.nextSibling;
        
        if (next && next.localName === "m") {
          const matrix = next as Element;
          const delimiter = doc.createElementNS(M, "m:d");
          const dPr = doc.createElementNS(M, "m:dPr");
          const begChr = doc.createElementNS(M, "m:begChr");
          begChr.setAttributeNS(M, "m:val", "{");
          const endChr = doc.createElementNS(M, "m:endChr");
          endChr.setAttributeNS(M, "m:val", "");
          
          dPr.appendChild(begChr as any);
          dPr.appendChild(endChr as any);
          delimiter.appendChild(dPr as any);
          
          const e = doc.createElementNS(M, "m:e");
          e.appendChild(matrix as any);
          delimiter.appendChild(e as any);
          
          run.parentNode?.replaceChild(delimiter as any, run as any);
        }
      }
    });
    
    let serialized = new XMLSerializer().serializeToString(doc);
    return serialized.replace(/<root[^>]*>|<\/root>/g, "").trim();
  } catch (e) {
    console.warn("fixSystemBraces failed:", e);
    return omml;
  }
}

function injectOMML(targetDoc: Document, parentElement: Element, omml: string, beforeNode?: Node) {
  try {
    const parser = new DOMParser();
    const snippet = `<root xmlns:m="${M}" xmlns:w="${W}">${omml}</root>`;
    const doc = parser.parseFromString(snippet, "text/xml");

    if (doc.documentElement && doc.documentElement.childNodes.length > 0) {
      const nodes = Array.from(doc.documentElement.childNodes);
      nodes.forEach(node => {
        const imported = targetDoc.importNode(node as any, true);
        if (beforeNode) {
          parentElement.insertBefore(imported as any, beforeNode as any);
        } else {
          parentElement.appendChild(imported as any);
        }
      });
      return true;
    }
    return false;
  } catch (e) {
    console.error("Injection Error:", e);
    return false;
  }
}

async function createParagraph(doc: Document, segments: ParsedSegment[]) {
  const p = elW(doc, "p");
  const pPr = elW(doc, "pPr");
  const spacing = elW(doc, "spacing");
  spacing.setAttributeNS(W, "w:after", "120");
  pPr.appendChild(spacing);
  p.appendChild(pPr);

  for (const seg of segments) {
    if (seg.type === "text") {
      const r = elW(doc, "r");
      r.appendChild(wRPr(doc, !!seg.bold));
      r.appendChild(wT(doc, seg.content));
      p.appendChild(r);
    } else if (seg.type === "math-inline") {
      const converted = await latexToOMML(seg.content, false);
      if (converted.omml && injectOMML(doc, p, converted.omml)) {
        // If it was bold, we'd need to apply it to OMML runs, but Word math usually
        // has its own bolding rules. For now, we inject as is.
        continue;
      }
      const r = elW(doc, "r");
      const rPr = wRPr(doc, !!seg.bold, "Cambria Math", "28");
      const i = elW(doc, "i");
      rPr.appendChild(i);
      r.appendChild(rPr);
      r.appendChild(wT(doc, converted.fallback));
      p.appendChild(r);
    }
  }
  return p;
}

export async function generateDocx(segments: ParsedSegment[]) {
  const dom = new DOMParser();
  const serializer = new XMLSerializer();

  const docXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="${W}" xmlns:m="${M}" xmlns:r="${R}">
  <w:body>
    <w:sectPr>
      <w:pgSz w:w="11906" w:h="16838"/>
      <w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440" w:header="720" w:footer="720" w:gutter="0"/>
    </w:sectPr>
  </w:body>
</w:document>`;

  const doc = dom.parseFromString(docXml, "text/xml") as unknown as Document;
  const body = doc.getElementsByTagNameNS(W, "body")[0] as unknown as Element;
  const sectPr = body.getElementsByTagNameNS(W, "sectPr")[0];

  let i = 0;
  while (i < segments.length) {
    const seg = segments[i];
    if (seg.type === "heading") {
      const p = elW(doc, "p");
      const pPr = elW(doc, "pPr");
      const pStyle = elW(doc, "pStyle");
      pStyle.setAttributeNS(W, "w:val", `Heading${seg.level || 1}`);
      pPr.appendChild(pStyle);
      p.appendChild(pPr);
      const r = elW(doc, "r");
      r.appendChild(wT(doc, seg.content));
      p.appendChild(r);
      body.insertBefore(p, sectPr);
      i++;
    } else if (seg.type === "math-block") {
      const converted = await latexToOMML(seg.content, true);
      if (converted.omml && injectOMML(doc, body as any, converted.omml, sectPr)) {
        // Success
      } else {
        const p = elW(doc, "p");
        const r = elW(doc, "r");
        r.appendChild(wRPr(doc, false, undefined, "28"));
        r.appendChild(wT(doc, converted.fallback));
        p.appendChild(r);
        body.insertBefore(p, sectPr);
      }
      i++;
    } else if (seg.type === "text" || seg.type === "math-inline") {
      const run: ParsedSegment[] = [];
      while (i < segments.length && (segments[i].type === "text" || segments[i].type === "math-inline")) {
        run.push(segments[i++]);
      }
      if (run.length > 0) {
        body.insertBefore(await createParagraph(doc, run), sectPr);
      }
    } else {
      i++;
    }
  }

  const zip = new AdmZip();

  // 1. [Content_Types].xml - CRITICAL: Correct content types for Word
  const contentTypes = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
  <Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>
  <Override PartName="/word/settings.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.settings+xml"/>
</Types>`;
  zip.addFile("[Content_Types].xml", Buffer.from(contentTypes, "utf-8"));

  // 2. _rels/.rels
  const rootRels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`;
  zip.addFile("_rels/.rels", Buffer.from(rootRels, "utf-8"));

  // 3. word/_rels/document.xml.rels
  const docRels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/settings" Target="settings.xml"/>
</Relationships>`;
  zip.addFile("word/_rels/document.xml.rels", Buffer.from(docRels, "utf-8"));

  // 4. word/styles.xml - Professional formatting for math documents
  const stylesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="${W}">
  <w:docDefaults>
    <w:rPrDefault>
      <w:rPr>
        <w:rFonts w:ascii="Calibri" w:hAnsi="Calibri" w:eastAsia="Calibri" w:cs="Arial"/>
        <w:sz w:val="24"/>
        <w:szCs w:val="24"/>
        <w:lang w:val="fr-FR"/>
      </w:rPr>
    </w:rPrDefault>
    <w:pPrDefault>
      <w:pPr>
        <w:spacing w:after="160" w:line="276" w:lineRule="auto"/>
      </w:pPr>
    </w:pPrDefault>
  </w:docDefaults>
  <w:style w:type="paragraph" w:default="1" w:styleId="Normal">
    <w:name w:val="Normal"/>
    <w:qFormat/>
  </w:style>
  <w:style w:type="paragraph" w:styleId="Heading1">
    <w:name w:val="heading 1"/>
    <w:basedOn w:val="Normal"/>
    <w:next w:val="Normal"/>
    <w:uiPriority w:val="9"/>
    <w:qFormat/>
    <w:pPr>
      <w:keepNext/>
      <w:keepLines/>
      <w:spacing w:before="400" w:after="120"/>
      <w:outlineLvl w:val="0"/>
      <w:bdr>
        <w:bottom w:val="single" w:sz="6" w:space="4" w:color="002060"/>
      </w:bdr>
    </w:pPr>
    <w:rPr>
      <w:rFonts w:asciiTheme="majorHAnsi" w:hAnsiTheme="majorHAnsi"/>
      <w:b/>
      <w:color w:val="002060"/>
      <w:sz w:val="32"/>
      <w:szCs w:val="32"/>
    </w:rPr>
  </w:style>
  <w:style w:type="paragraph" w:styleId="Heading2">
    <w:name w:val="heading 2"/>
    <w:basedOn w:val="Normal"/>
    <w:next w:val="Normal"/>
    <w:uiPriority w:val="9"/>
    <w:qFormat/>
    <w:pPr>
      <w:keepNext/>
      <w:keepLines/>
      <w:spacing w:before="240" w:after="80"/>
      <w:outlineLvl w:val="1"/>
    </w:pPr>
    <w:rPr>
      <w:rFonts w:asciiTheme="majorHAnsi" w:hAnsiTheme="majorHAnsi"/>
      <w:b/>
      <w:color w:val="002060"/>
      <w:sz w:val="28"/>
      <w:szCs w:val="28"/>
    </w:rPr>
  </w:style>
  <w:style w:type="paragraph" w:styleId="Heading3">
    <w:name w:val="heading 3"/>
    <w:basedOn w:val="Normal"/>
    <w:next w:val="Normal"/>
    <w:uiPriority w:val="9"/>
    <w:qFormat/>
    <w:pPr>
      <w:keepNext/>
      <w:keepLines/>
      <w:spacing w:before="160" w:after="60"/>
      <w:outlineLvl w:val="2"/>
    </w:pPr>
    <w:rPr>
      <w:b/>
      <w:color w:val="002060"/>
      <w:sz w:val="25"/>
      <w:szCs w:val="25"/>
    </w:rPr>
  </w:style>
</w:styles>`;
  zip.addFile("word/styles.xml", Buffer.from(stylesXml, "utf-8"));

  // 5. word/settings.xml - Math layout settings
  const settingsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:settings xmlns:w="${W}" xmlns:m="${M}">
  <m:mathPr>
    <m:mathFont m:val="Cambria Math"/>
    <m:brkBin m:val="before"/>
    <m:brkBinSub m:val="--"/>
    <m:smallFrac m:val="0"/>
    <m:dispDef/>
    <m:lMargin m:val="0"/>
    <m:rMargin m:val="0"/>
    <m:defJc m:val="centerGroup"/>
    <m:wrapIndent m:val="1440"/>
    <m:intLim m:val="subSup"/>
    <m:naryLim m:val="undOvr"/>
  </m:mathPr>
</w:settings>`;
  zip.addFile("word/settings.xml", Buffer.from(settingsXml, "utf-8"));

  // 6. word/document.xml
  zip.addFile("word/document.xml", Buffer.from(serializer.serializeToString(doc as any), "utf-8"));

  return zip.toBuffer();
}
