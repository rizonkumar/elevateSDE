import { Injectable } from '@nestjs/common';
import * as mammoth from 'mammoth';
import { IResumeTextExtractor } from '../../domain/interfaces/resume-text-extractor.interface';

const PDF_MIME_TYPE = 'application/pdf';

function normalizeExtractedText(text: string): string {
  return text
    .replace(/\s+\n/g, '\n')
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
    const pages: string[] = [];
    for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
      const page = await document.getPage(pageNumber);
      const content = await page.getTextContent();
      const pageText = content.items.map((item) => ('str' in item ? item.str : '')).join(' ');
      pages.push(pageText);
    }
    await loadingTask.destroy();
    return pages.join('\n');
  }

  private async extractDocxText(buffer: Buffer): Promise<string> {
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  }
}
