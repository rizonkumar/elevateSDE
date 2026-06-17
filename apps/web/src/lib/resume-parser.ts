import * as mammoth from 'mammoth';

export const MAX_RESUME_SIZE_BYTES = 5 * 1024 * 1024;

interface AcceptedType {
  mime: string;
  extension: string;
}

export const ACCEPTED_RESUME_TYPES: AcceptedType[] = [
  { mime: 'application/pdf', extension: '.pdf' },
  {
    mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    extension: '.docx',
  },
];

function hasExtension(fileName: string, extension: string): boolean {
  return fileName.toLowerCase().endsWith(extension);
}

function isPdf(file: File): boolean {
  return file.type === 'application/pdf' || hasExtension(file.name, '.pdf');
}

function isDocx(file: File): boolean {
  return (
    file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    hasExtension(file.name, '.docx')
  );
}

export function validateResumeFile(file: File): string | null {
  if (!isPdf(file) && !isDocx(file)) {
    return 'Please upload a PDF or DOCX resume.';
  }
  if (file.size > MAX_RESUME_SIZE_BYTES) {
    return 'File is too large. Keep your resume under 5 MB.';
  }
  return null;
}

let workerConfigured = false;

async function extractPdfText(file: File): Promise<string> {
  const pdfjs = await import('pdfjs-dist');
  if (!workerConfigured) {
    pdfjs.GlobalWorkerOptions.workerSrc = new URL(
      'pdfjs-dist/build/pdf.worker.min.mjs',
      import.meta.url,
    ).toString();
    workerConfigured = true;
  }
  const data = await file.arrayBuffer();
  const loadingTask = pdfjs.getDocument({ data });
  const document = await loadingTask.promise;
  const pages: string[] = [];
  for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
    const page = await document.getPage(pageNumber);
    const content = await page.getTextContent();
    const pageText = content.items
      .map((item) => ('str' in item ? item.str : ''))
      .join(' ');
    pages.push(pageText);
  }
  await loadingTask.destroy();
  return pages.join('\n');
}

async function extractDocxText(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer });
  return result.value;
}

export async function extractResumeText(file: File): Promise<string> {
  const text = isPdf(file) ? await extractPdfText(file) : await extractDocxText(file);
  return text.replace(/\s+\n/g, '\n').replace(/[ \t]{2,}/g, ' ').trim();
}
