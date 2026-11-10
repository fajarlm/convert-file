declare module 'mammoth' {
  export interface RawTextResult {
    value: string;
    messages: unknown[];
  }
  export interface HtmlResult {
    value: string;
    messages: unknown[];
  }
  export function extractRawText(input: { arrayBuffer?: ArrayBuffer; buffer?: Buffer }): Promise<RawTextResult>;
  export function convertToHtml(input: { arrayBuffer?: ArrayBuffer; buffer?: Buffer }): Promise<HtmlResult>;
}
