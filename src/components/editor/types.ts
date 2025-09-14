import { LUT } from "@/components/editor/luts";

export interface ImageProperties {
    lut: LUT;
    brightness: number;
    contrast: number;
    saturation: number;
    hue: number;
    vignette_size: number;
    vignette_sharpness: number;
    sharpness: number;
    structure: number;

    red_hue: number;
    red_saturation: number;
    red_lightness: number;
    orange_hue: number;
    orange_saturation: number;
    orange_lightness: number;
    yellow_hue: number;
    yellow_saturation: number;
    yellow_lightness: number;
    green_hue: number;
    green_saturation: number;
    green_lightness: number;
    blue_hue: number;
    blue_saturation: number;
    blue_lightness: number;
    magenta_hue: number;
    magenta_saturation: number;
    magenta_lightness: number;

};