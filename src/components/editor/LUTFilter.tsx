"use client";

import { RootState } from "@react-three/fiber";

import dynamic from "next/dynamic";

const LUTFilterImpl = dynamic(() => import("./LUTFilterImpl"), { ssr: false });

export const LUTFilter = (props: { 
    image: string; 
    lut: string | null, 
    brightness: number, 
    contrast: number, 
    saturation: number, 
    hue: number,
    vignette_size: number,
    vignette_sharpness: number,
    sharpness: number,
    structure: number,
    canvasRef: React.RefObject<RootState>
}) => {
    return <LUTFilterImpl {...props} />;
};
