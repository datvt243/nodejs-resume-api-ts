/**
 * Sets real PDF metadata (Title/Author/Subject/Keywords/Creator/Language)
 * after Puppeteer renders the document — Chromium's own print-to-PDF path
 * does not expose a way to set these. See
 * `doctrine/standards/pdf-export-standard.md` rule 9.
 *
 * @author Đạt Võ <votan.it@gmail.com>
 * @see https://github.com/datvt243
 */
import { PDFDocument } from 'pdf-lib';

export interface PdfMetadataInput {
  title: string;
  author: string;
  subject: string;
  keywords: string[];
  creator: string;
  language: string;
}

export const applyPdfMetadata = async (pdfBuffer: Buffer, meta: PdfMetadataInput): Promise<Buffer> => {
  const doc = await PDFDocument.load(pdfBuffer);
  doc.setTitle(meta.title);
  doc.setAuthor(meta.author);
  doc.setSubject(meta.subject);
  doc.setKeywords(meta.keywords);
  doc.setCreator(meta.creator);
  doc.setLanguage(meta.language);
  const bytes = await doc.save();
  return Buffer.from(bytes);
};
