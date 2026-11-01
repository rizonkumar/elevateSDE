export interface SecurityHeader {
  key: string;
  value: string;
}

export interface SecurityHeaderOptions {
  apiUrl: string | undefined;
  isDev: boolean;
}

export function buildSecurityHeaders(options: SecurityHeaderOptions): SecurityHeader[];
