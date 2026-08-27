export declare const ICON_SIZES: readonly [192, 512];
export declare const MASKABLE_SIZE: 512;
export declare const APPLE_TOUCH_SIZE: 180;

export interface IconManifestEntry {
  src: string;
  sizes: string;
  type: string;
  purpose: "any" | "maskable";
}

export declare function iconManifestEntries(baseUrl?: string): IconManifestEntry[];
