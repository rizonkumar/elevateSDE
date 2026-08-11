export abstract class IResumeTextExtractor {
  abstract extract(buffer: Buffer, mimeType: string): Promise<string>;
}
