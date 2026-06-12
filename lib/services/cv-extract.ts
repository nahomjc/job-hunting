import mammoth from "mammoth";

const MAX_FILE_BYTES = 5 * 1024 * 1024; // 5 MB

const ALLOWED_TYPES = new Set([
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
]);

const ALLOWED_EXTENSIONS = new Set([".pdf", ".docx", ".txt"]);

export function validateCvFile(file: File) {
  if (file.size > MAX_FILE_BYTES) {
    throw new Error("File too large. Maximum size is 5 MB.");
  }

  const ext = file.name.toLowerCase().slice(file.name.lastIndexOf("."));
  if (!ALLOWED_EXTENSIONS.has(ext) && !ALLOWED_TYPES.has(file.type)) {
    throw new Error("Unsupported file type. Upload PDF, DOCX, or TXT.");
  }
}

async function extractPdfText(buffer: Buffer): Promise<string> {
  const { extractText, getDocumentProxy } = await import("unpdf");
  const pdf = await getDocumentProxy(new Uint8Array(buffer));
  const { text } = await extractText(pdf, { mergePages: true });
  return text?.trim() ?? "";
}

async function extractDocxText(buffer: Buffer): Promise<string> {
  const result = await mammoth.extractRawText({ buffer });
  return result.value?.trim() ?? "";
}

export async function extractTextFromCv(file: File): Promise<string> {
  validateCvFile(file);

  const buffer = Buffer.from(await file.arrayBuffer());
  const name = file.name.toLowerCase();

  let text = "";

  if (name.endsWith(".pdf") || file.type === "application/pdf") {
    text = await extractPdfText(buffer);
  } else if (
    name.endsWith(".docx") ||
    file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    text = await extractDocxText(buffer);
  } else {
    text = buffer.toString("utf-8").trim();
  }

  if (!text || text.length < 50) {
    throw new Error(
      "Could not extract enough text from this file. Try a text-based PDF or paste your resume manually."
    );
  }

  return text.slice(0, 30_000);
}
