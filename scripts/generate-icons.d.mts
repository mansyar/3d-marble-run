export declare const ICON_SIZES: readonly [192, 512];
export declare const MASKABLE_SIZE: 512;
export declare const APPLE_TOUCH_SIZE: 180;

export interface IconManifestEntry {
  src: string;
  sizes: string;
  type: string;
  purpose: "any" | "maskable";
}

export interface WebAppManifest {
  name: string;
  short_name: string;
  description: string;
  id: string;
  start_url: string;
  scope: string;
  display: string;
  orientation: string;
  background_color: string;
  theme_color: string;
  icons: IconManifestEntry[];
}

export declare const MANIFEST_META: Readonly<{
  name: string;
  short_name: string;
  description: string;
  id: string;
  start_url: string;
  scope: string;
  display: "standalone";
  orientation: "any";
  background_color: string;
  theme_color: string;
}>;

export declare function iconManifestEntries(baseUrl?: string): IconManifestEntry[];
export declare function buildManifest(baseUrl?: string): WebAppManifest;
