export interface ConvertResponse {
  error?: string;
  details?: string;
  hint?: string;
  message?: string;
}

export async function convertToDocx(text: string): Promise<Blob> {
  if (!text || text.trim().length === 0) throw new Error("Input text cannot be empty");
  try {
    const response = await fetch("/api/convert", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
    if (!response.ok) {
      let msg = `Conversion failed with status ${response.status}`, det = "";
      try {
        const data = (await response.json()) as ConvertResponse;
        msg = data.error || msg;
        det = data.details || data.hint || data.message || "";
      } catch {}
      throw new Error(det ? `${msg}: ${det}` : msg);
    }
    const ct = response.headers.get("content-type");
    if (!ct?.includes("application/vnd.openxmlformats-officedocument.wordprocessingml.document")) throw new Error("Invalid response: expected Word document");
    return await response.blob();
  } catch (error) {
    if (error instanceof Error) throw error;
    throw new Error("An unexpected error occurred during conversion");
  }
}

export function downloadFile(blob: Blob, filename: string): void {
  try {
    const url = URL.createObjectURL(blob), link = document.createElement("a");
    link.href = url; link.download = filename; link.style.display = "none";
    document.body.appendChild(link); link.click(); document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (error) {
    throw new Error("Failed to download file");
  }
}

export async function convertAndDownload(text: string, filename: string = "converted.docx"): Promise<void> {
  const blob = await convertToDocx(text);
  downloadFile(blob, filename);
}
