import { ACCEPTED_RESUME_MIME_TYPES, MAX_RESUME_SIZE_BYTES } from '@elevatesde/shared-types';

export { MAX_RESUME_SIZE_BYTES };

interface AcceptedType {
  mime: string;
  extension: string;
}

function extensionFor(mime: string): string {
  return mime === 'application/pdf' ? '.pdf' : '.docx';
}

export const ACCEPTED_RESUME_TYPES: AcceptedType[] = ACCEPTED_RESUME_MIME_TYPES.map((mime) => ({
  mime,
  extension: extensionFor(mime),
}));

function hasExtension(fileName: string, extension: string): boolean {
  return fileName.toLowerCase().endsWith(extension);
}

function matchesAcceptedType(file: File): boolean {
  if (ACCEPTED_RESUME_MIME_TYPES.includes(file.type)) {
    return true;
  }
  return ACCEPTED_RESUME_TYPES.some((type) => hasExtension(file.name, type.extension));
}

export function validateResumeFile(file: File): string | null {
  if (!matchesAcceptedType(file)) {
    return 'Please upload a PDF or DOCX resume.';
  }
  if (file.size > MAX_RESUME_SIZE_BYTES) {
    return 'File is too large. Keep your resume under 5 MB.';
  }
  return null;
}
