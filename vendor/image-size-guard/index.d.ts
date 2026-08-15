export interface ImageDimensions {
  width: number;
  height: number;
  type?: string;
  orientation?: number;
}

export declare const ERROR_CODE: "ERR_VWYS_IMAGE_SIZE_DISABLED";
export declare const types: readonly string[];
export declare function disableTypes(disabledTypes: readonly string[]): void;
export declare function imageSize(input: Uint8Array | string): ImageDimensions;
export default imageSize;
