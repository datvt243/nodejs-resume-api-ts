/**
 * Thin wrapper around `pdf-parse` — the text-extraction step the
 * ATS self-check endpoint uses to prove a generated PDF is actually
 * readable by a real parser, not just visually correct.
 * See `doctrine/standards/pdf-export-standard.md`: any claim about a
 * PDF being ATS-safe must be backed by extracted text, not a visual
 * check.
 */
import pdfParse from 'pdf-parse';

export interface ExtractedPdf {
  text: string;
  pages: number;
}

export const extractPdfText = async (buffer: Buffer): Promise<ExtractedPdf> => {
  const result = await pdfParse(buffer);
  return {
    text: result.text,
    pages: result.numpages,
  };
};
