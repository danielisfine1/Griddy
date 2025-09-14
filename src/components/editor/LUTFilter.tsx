"use client";

import dynamic from "next/dynamic";

import { ImagePreviewProps } from "@/components/editor/ImagePreview";

const LUTFilterImpl = dynamic(() => import("./LUTFilterImpl"), { ssr: false });

export const LUTFilter = (props: ImagePreviewProps) => {
    return <LUTFilterImpl {...props} />;
};
