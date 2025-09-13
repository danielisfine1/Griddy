'use client';

import { CSSProperties, useEffect, useState } from "react";
import { ImageProperties } from "@/components/editor/types";
import type { LUT } from "./luts";
import { LUTFilter } from "./LUTFilter";

import { RootState } from "@react-three/fiber";

const formatPath = (lut: LUT) => {

    if (lut) {
        return `/lut/${lut}.cube`;
    };

    return null;

};

export const ImagePreview = ({
    image,
    imageProperties,
    canvasRef
}: {
    image: string;
    imageProperties: ImageProperties;
    canvasRef: React.RefObject<RootState>;
}) => {

    const [aspectRatio, setAspectRatio] = useState<number | null>(null);

    useEffect(() => {
        if (image) {
            const img = new window.Image();
            img.src = image;

            img.onload = () => {
                setAspectRatio(img.naturalWidth / img.naturalHeight);
            };
        }
    }, [image]);

    const cropStyle: CSSProperties = {
        position: "relative",
        width: "100%",
        overflow: "hidden",
        aspectRatio: aspectRatio ? `${aspectRatio}` : undefined,
    };

    return (
        <div className="relative w-full flex items-center justify-center bg-gray-100">
            <div style={cropStyle}>
                <LUTFilter
                    image={image}
                    lut={formatPath(imageProperties.lut)}
                    brightness={imageProperties.brightness}
                    contrast={imageProperties.contrast}
                    saturation={imageProperties.saturation}
                    hue={imageProperties.hue}
                    vignette_size={imageProperties.vignette_size}
                    vignette_sharpness={imageProperties.vignette_sharpness}
                    sharpness={imageProperties.sharpness}
                    structure={imageProperties.structure}
                    canvasRef={canvasRef}
                />
            </div>
        </div>
    );
};
