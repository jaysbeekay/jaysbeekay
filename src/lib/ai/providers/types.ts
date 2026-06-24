export interface ProviderCallParams {
  apiKey: string;
  model: string;
  buffer: Buffer;
  mimeType: string;
  prompt: string;
}

export type ProviderCall = (params: ProviderCallParams) => Promise<string | null>;

export const PROVIDER_TIMEOUT_MS = 45_000;
