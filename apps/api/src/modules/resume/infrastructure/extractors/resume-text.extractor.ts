import { Injectable } from '@nestjs/common';
import * as mammoth from 'mammoth';
import { IResumeTextExtractor } from '../../domain/interfaces/resume-text-extractor.interface';

const PDF_MIME_TYPE = 'application/pdf';

function collapseWhitespaceBeforeNewline(run: string): string {
  const lastNewline = run.lastIndexOf('\n');
  return lastNewline === -1 ? run : `\n${run.slice(lastNewline + 1)}`;
}

function normalizeExtractedText(text: string): string {
  return text
    .replace(/\s+/g, collapseWhitespaceBeforeNewline)
    .replace(/[ \t]{2,}/g, ' ')
    .trim();
}

@Injectable()
export class ResumeTextExtractor implements IResumeTextExtractor {
  async extract(buffer: Buffer, mimeType: string): Promise<string> {
    const text =
      mimeType === PDF_MIME_TYPE
        ? await this.extractPdfText(buffer)
        : await this.extractDocxText(buffer);
    return normalizeExtractedText(text);
  }

  private async extractPdfText(buffer: Buffer): Promise<string> {
    const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
    const loadingTask = pdfjs.getDocument({ data: new Uint8Array(buffer) });
    const document = await loadingTask.promise;
    const pages = await Promise.all(
      Array.from({ length: document.numPages }, async (_, index) => {
        const page = await document.getPage(index + 1);
        const content = await page.getTextContent();
        return content.items.map((item) => ('str' in item ? item.str : '')).join(' ');
      }),
    );
    await loadingTask.destroy();
    return pages.join('\n');
  }

  private async extractDocxText(buffer: Buffer): Promise<string> {
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  }
}
