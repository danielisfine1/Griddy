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
    structure: number
};