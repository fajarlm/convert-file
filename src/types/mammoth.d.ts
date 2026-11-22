declare module "mammoth" {
  export interface ImageElement {
    read(encoding: string): Promise<string>;
    contentType: string;
  }

  export namespace images {
    export function imgElement(
      element: (image: ImageElement) => Promise<{ src: string }>
    ): unknown;
  }

  export interface ConvertOptions {
    convertImage?: unknown;
    styleMap?: string | string[];
    includeDefaultStyleMap?: boolean;
  }

  export interface Result {
    value: string;
    messages: unknown[];
  }

  export function convertToHtml(
    input: { arrayBuffer: ArrayBuffer } | { path: string },
    options?: ConvertOptions
  ): Promise<Result>;

  export function extractRawText(
    input: { arrayBuffer: ArrayBuffer } | { path: string }
  ): Promise<Result>;
}
