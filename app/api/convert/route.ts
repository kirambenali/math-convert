import { NextRequest, NextResponse } from "next/server";
import { parseInput } from "@/lib/parser";
import { generateDocx } from "@/lib/docx";

export async function POST(req: NextRequest) {
  try {
    const { text } = await req.json();
    if (!text) return NextResponse.json({ error: "Text required" }, { status: 400 });
    const buffer = await generateDocx(parseInput(text));
    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": 'attachment; filename="math.docx"',
      },
    });
  } catch (e) {
    return NextResponse.json({ error: "Failed", m: String(e) }, { status: 500 });
  }
}
