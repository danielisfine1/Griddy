'use client';

import { CSSProperties, useEffect, useState } from "react";
import { ImageProperties } from "@/components/editor/types";
import type { LUT } from "@/components/editor/luts";
import { LUTFilter } from "@/components/editor/LUTFilter";

import { RootState } from "@react-three/fiber";

const formatPath = (lut: LUT | null) => {

    if (lut) {
        return `/lut/${lut}.cube`;
    };

    return null;

};

export interface ImagePreviewImageProperties extends Omit<ImageProperties, "lut"> {
    lut: string | null;
};

export interface ImagePreviewProps {
    image: string;
    imageProperties: ImagePreviewImageProperties;
    fit: "cover" | "contain";
    canvasRef?: React.RefObject<RootState>;
};

export const ImagePreview = ({
    image,
    imageProperties,
    fit,
    canvasRef
}: ImagePreviewProps) => {

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
        height: "100%",
        overflow: "hidden",
        aspectRatio: aspectRatio ? `${aspectRatio}` : undefined,
    };

    return (
        <div className="relative w-full h-full flex items-center justify-center bg-gray-100">
            <div style={cropStyle}>
                <LUTFilter
                    image={image}
                    imageProperties={{
                        ...imageProperties,
                        lut: formatPath(imageProperties.lut as LUT | null)
                    }}
                    fit={fit}
                    canvasRef={canvasRef}
                />
            </div>
        </div>
    );
};
