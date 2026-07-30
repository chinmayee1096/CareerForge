import zlib from "zlib";
import mammoth from "mammoth";
import { PDFParse } from "pdf-parse";
import WordExtractor from "word-extractor";

const normalizeText = (text = "") =>
  text
    .replace(/\r/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

const stripXml = (xml = "") =>
  normalizeText(
    xml
      .replace(/<w:tab\/>/g, " ")
      .replace(/<w:br\/>/g, "\n")
      .replace(/<\/w:p>/g, "\n")
      .replace(/<[^>]+>/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, "\"")
      .replace(/&apos;/g, "'")
  );

const readUInt16LE = (buffer, offset) => (offset + 2 <= buffer.length ? buffer.readUInt16LE(offset) : 0);
const readUInt32LE = (buffer, offset) => (offset + 4 <= buffer.length ? buffer.readUInt32LE(offset) : 0);

const extractZipEntry = (buffer, targetName) => {
  let offset = 0;
  while (offset < buffer.length - 30) {
    if (readUInt32LE(buffer, offset) !== 0x04034b50) {
      offset += 1;
      continue;
    }

    const compression = readUInt16LE(buffer, offset + 8);
    const compressedSize = readUInt32LE(buffer, offset + 18);
    const fileNameLength = readUInt16LE(buffer, offset + 26);
    const extraLength = readUInt16LE(buffer, offset + 28);
    const fileNameStart = offset + 30;
    const fileName = buffer.toString("utf8", fileNameStart, fileNameStart + fileNameLength);
    const dataStart = fileNameStart + fileNameLength + extraLength;
    const dataEnd = dataStart + compressedSize;

    if (fileName === targetName) {
      const compressed = buffer.subarray(dataStart, dataEnd);
      if (compression === 0) return compressed.toString("utf8");
      if (compression === 8) return zlib.inflateRawSync(compressed).toString("utf8");
      throw new Error("Unsupported DOCX compression format.");
    }

    offset = dataEnd;
  }
  return "";
};

const extractDocxText = (buffer) => {
  const documentXml = extractZipEntry(buffer, "word/document.xml");
  if (!documentXml) throw new Error("Could not read text from this DOCX file.");
  return stripXml(documentXml);
};

const extractDocxTextWithMammoth = async (buffer) => {
  const result = await mammoth.extractRawText({ buffer });
  const text = normalizeText(result.value || "");
  if (!text || text.length < 40) {
    throw new Error("Could not extract readable text from this DOCX file.");
  }
  return text;
};

const decodePdfEscapes = (value = "") =>
  value
    .replace(/\\n/g, "\n")
    .replace(/\\r/g, "\n")
    .replace(/\\t/g, " ")
    .replace(/\\\(/g, "(")
    .replace(/\\\)/g, ")")
    .replace(/\\\\/g, "\\");

const extractPdfStrings = (content = "") => {
  const matches = [...content.matchAll(/\((?:\\.|[^\\)])*\)/g)];
  return matches
    .map((match) => decodePdfEscapes(match[0].slice(1, -1)))
    .filter((text) => /[a-zA-Z]{2,}/.test(text))
    .join("\n");
};

const extractPdfText = (buffer) => {
  const raw = buffer.toString("latin1");
  const streamRegex = /<<[^>]*\/Filter\s*\/FlateDecode[^>]*>>\s*stream\r?\n([\s\S]*?)\r?\nendstream/g;
  const streamTexts = [];

  for (const match of raw.matchAll(streamRegex)) {
    try {
      const streamBuffer = Buffer.from(match[1], "latin1");
      const inflated = zlib.inflateSync(streamBuffer).toString("latin1");
      const extracted = extractPdfStrings(inflated);
      if (extracted) streamTexts.push(extracted);
    } catch {
      // Some PDF streams use unsupported encodings. Continue with other streams.
    }
  }

  const plainText = extractPdfStrings(raw);
  const text = normalizeText([...streamTexts, plainText].filter(Boolean).join("\n"));
  if (!text || text.length < 40) {
    throw new Error("Could not extract readable text from this PDF. Try exporting the resume as text or DOCX.");
  }
  return text;
};

const extractPdfTextWithParser = async (buffer) => {
  const parser = new PDFParse({ data: buffer });
  try {
    const result = await parser.getText();
    const text = normalizeText(result.text || "");
    if (!text || text.length < 40) {
      throw new Error("Could not extract readable text from this PDF.");
    }
    return text;
  } finally {
    await parser.destroy?.();
  }
};

const extractLegacyDocText = (buffer) => {
  const text = normalizeText(
    buffer
      .toString("latin1")
      .replace(/[^\x20-\x7E\n\r\t]/g, " ")
      .replace(/\s{2,}/g, " ")
  );
  if (!text || text.length < 40) {
    throw new Error("Could not extract readable text from this DOC file. Please upload DOCX/PDF or paste resume text.");
  }
  return text;
};

const extractLegacyDocTextWithParser = async (buffer) => {
  const extractor = new WordExtractor();
  const doc = await extractor.extract(buffer);
  const text = normalizeText(
    [
      doc.getBody?.(),
      doc.getHeaders?.(),
      doc.getFooters?.(),
      doc.getFootnotes?.(),
      doc.getEndnotes?.(),
      doc.getAnnotations?.(),
      doc.getTextboxes?.()
    ]
      .filter(Boolean)
      .join("\n")
  );
  if (!text || text.length < 40) {
    throw new Error("Could not extract readable text from this DOC file.");
  }
  return text;
};

export const extractResumeTextFromFile = async ({ buffer, originalName = "", mimeType = "" }) => {
  const extension = originalName.slice(originalName.lastIndexOf(".")).toLowerCase();
  if (extension === ".txt" || extension === ".md" || mimeType.startsWith("text/")) {
    return normalizeText(buffer.toString("utf8"));
  }
  if (extension === ".docx" || mimeType.includes("wordprocessingml")) {
    try {
      return await extractDocxTextWithMammoth(buffer);
    } catch {
      return extractDocxText(buffer);
    }
  }
  if (extension === ".pdf" || mimeType === "application/pdf") {
    try {
      return await extractPdfTextWithParser(buffer);
    } catch {
      return extractPdfText(buffer);
    }
  }
  if (extension === ".doc" || mimeType === "application/msword") {
    try {
      return await extractLegacyDocTextWithParser(buffer);
    } catch {
      return extractLegacyDocText(buffer);
    }
  }
  throw new Error("Unsupported resume file type. Upload PDF, DOC, DOCX, TXT, or MD.");
};
