'use client';

import { IconButton } from "@mui/material";

import { useState, useRef } from "react";

import { IoIosContrast, IoMdColorPalette } from "react-icons/io";
import { BsBrightnessHigh } from "react-icons/bs";
import { IoMdClose, IoMdColorFill } from "react-icons/io";
import { FaFilm, FaRegEyeSlash, FaRegEye, FaHome } from "react-icons/fa";

import { BsVignette } from "react-icons/bs";
import { MdDetails } from "react-icons/md";
import { FaRegFloppyDisk } from "react-icons/fa6";
import { VscDiscard } from "react-icons/vsc";

import { ImageProperties } from "@/components/editor/types";

import { ImagePreview } from "@/components/editor/ImagePreview";

import { LinearInput } from "@/components/editor/inputs/LinearInput";

import { LUTInput } from "@/components/editor/inputs/LUTInput";

import axios from "axios";

import { RootState } from "@react-three/fiber";

import { resetPost } from "@/utils/grids/posts";

export const EditorOptions = (
    { imageProperties, setImageProperties, editsVisible, setEditsVisible, base, onSave, onReset }:
        {
            imageProperties: ImageProperties,
            setImageProperties: React.Dispatch<React.SetStateAction<ImageProperties>>,
            editsVisible: boolean,
            setEditsVisible: React.Dispatch<React.SetStateAction<boolean>>,
            base: ImageProperties,
            onSave: () => void,
            onReset: () => void
        }
) => {

    const [active, setActive] = useState<string | null>(null);

    const options = [
        {
            id: "home",
            name: "Home",
            icon: <FaHome className="text-gray-600" />,
            onClick: () => {
                window.location.href = "/";
            }
        },
        {
            id: "brightness",
            name: "Brightness",
            icon: <BsBrightnessHigh className={imageProperties.brightness === base.brightness ? "text-gray-600" : "text-blue-600"} />,
            editor: <LinearInput value={imageProperties.brightness} onChange={(e, value) => setImageProperties({ ...imageProperties, brightness: value as number })} />
        },
        {
            id: "contrast",
            name: "Contrast",
            icon: <IoIosContrast className={imageProperties.contrast === base.contrast ? "text-gray-600" : "text-blue-600"} />,
            editor: <LinearInput value={imageProperties.contrast} onChange={(e, value) => setImageProperties({ ...imageProperties, contrast: value as number })} />
        },
        {
            id: "hue",
            name: "Hue",
            icon: <IoMdColorFill className={imageProperties.hue === base.hue ? "text-gray-600" : "text-blue-600"} />,
            editor: <LinearInput max={360} value={imageProperties.hue} onChange={(e, value) => setImageProperties({ ...imageProperties, hue: value as number })} />
        },
        {
            id: "saturation",
            name: "Saturation",
            icon: <IoMdColorPalette className={imageProperties.saturation === base.saturation ? "text-gray-600" : "text-blue-600"} />,
            editor: <LinearInput value={imageProperties.saturation} onChange={(e, value) => setImageProperties({ ...imageProperties, saturation: value as number })} />
        },
        {
            id: "details",
            name: "Details",
            icon: <MdDetails className="text-gray-600" />,
            editor: (
                <div className="z-10 w-full flex flex-col items-center gap-5">
                    <div className="w-full flex flex-row items-center gap-5">
                        <p>Sharpness</p>
                        <LinearInput
                            value={imageProperties.sharpness}
                            onChange={(e, value) => setImageProperties({ ...imageProperties, sharpness: value as number })}
                        />
                    </div>
                    <div className="w-full flex flex-row items-center gap-5">
                        <p>Structure</p>
                        <LinearInput
                            value={imageProperties.structure}
                            onChange={(e, value) => setImageProperties({ ...imageProperties, structure: value as number })}
                        />
                    </div>
                </div>
            )
        },
        {
            id: "vignette",
            name: "Vignette",
            icon: <BsVignette className="text-gray-600" />,
            editor: (
                <div className="z-10 w-full flex flex-col items-center gap-5">
                    <div className="w-full flex flex-row items-center gap-5">
                        <p>Size</p>
                        <LinearInput
                            min={0}
                            max={1}
                            step={0.01}
                            value={imageProperties.vignette_size}
                            onChange={(e, value) => setImageProperties({ ...imageProperties, vignette_size: value as number })}
                        />
                    </div>
                    <div className="w-full flex flex-row items-center gap-5">
                        <p>Sharpness</p>
                        <LinearInput
                            min={0}
                            max={1}
                            step={0.01}
                            value={imageProperties.vignette_sharpness}
                            onChange={(e, value) => setImageProperties({ ...imageProperties, vignette_sharpness: value as number })}
                        />
                    </div>
                </div>
            )
        },
        {
            id: "lut",
            name: "LUT",
            icon: <FaFilm className={imageProperties.lut === base.lut ? "text-gray-600" : "text-blue-600"} />,
            editor: <LUTInput value={imageProperties.lut} onChange={(value) => setImageProperties({ ...imageProperties, lut: value })} />
        },
        {
            id: "edits_visible",
            name: "Edits Visible",
            icon: editsVisible ? <FaRegEye className="text-gray-600" /> : <FaRegEyeSlash className="text-gray-600" />,
            onClick: () => {
                setEditsVisible(!editsVisible);
            }
        },
        {
            id: "reset",
            name: "Reset",
            icon: <VscDiscard className="text-gray-600" />,
            onClick: onReset
        },
        {
            id: "save",
            name: "Save",
            icon: <FaRegFloppyDisk className="text-gray-600" />,
            onClick: onSave
        }
    ];

    return (
        <div className="w-full flex justify-between items-center gap-5 p-2">

            {
                active ? (
                    <div className="w-full flex flex-row items-center justify-between gap-5">
                        <div className="w-full flex flex-col items-center">
                            {options.find((option) => option.id === active)?.editor}
                        </div>
                        <IconButton onClick={() => setActive(null)}>
                            <IoMdClose className="text-gray-600" />
                        </IconButton>
                    </div>
                ) : (
                    <div className="w-full flex flex-row items-center gap-5 p-2 overflow-auto">
                        {   
                            options.map((option) => {
                                return (
                                    <IconButton
                                        key={option.id}
                                        onClick={
                                            option.onClick ? option.onClick : () => {
                                                setActive(option.id);
                                            }
                                        }
                                    >
                                        {option.icon}
                                    </IconButton>
                                );
                            })
                        }
                    </div>
                )
            }

        </div>
    )

};

export const Editor = ({ image, postId, imageProperties: initialImageProperties }: { image: string, postId: string, imageProperties: ImageProperties }) => {

    const base = {
        brightness: 100,
        contrast: 100,
        saturation: 100,
        hue: 0,
        vignette_size: 0,
        vignette_sharpness: 0,
        sharpness: 0,
        structure: 0,
        lut: null
    };

    const [imageProperties, setImageProperties] = useState<ImageProperties>(initialImageProperties);
    const [editsVisible, setEditsVisible] = useState<boolean>(true);

    const canvasRef = useRef<RootState | null>(null);

    async function captureEditedImage(): Promise<File> {
        return new Promise((resolve, reject) => {
            const state = canvasRef.current;
            if (!state) return reject(new Error("Canvas not ready"));

            const gl = state.gl;
            const canvas = gl.domElement;

            state.advance(performance.now());

            canvas.toBlob((blob) => {
                if (!blob) return reject(new Error("Failed to capture canvas"));
                resolve(new File([blob], "edited.png", { type: "image/png" }));
            }, "image/png");
        });
    };

    const handleSave = async () => {

        try {

            const file = await captureEditedImage();

            const formData = new FormData();
            formData.append("image", file);
            formData.append("post_id", postId);

            for (const [key, value] of Object.entries(imageProperties)) {
                formData.append(key, value.toString());
            };

            const res = await axios.post("/api/v1/posts/edits/upload", formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });

            if (res.status === 200) {
                console.log(res.data);
                window.location.reload();
            };

        } catch (err) {

            console.error(err);

        };

    };

    const handleReset = async () => {

        const res = await resetPost({ id: postId });

        if (res.data) {
            window.location.reload();
        };

    };

    return (
        <div className="bg-gray-200 w-full h-screen flex flex-col items-center justify-center p-2">

            <ImagePreview
                image={image}
                imageProperties={editsVisible ? imageProperties : base}
                canvasRef={canvasRef as React.RefObject<RootState>}
            />

            <div className="bg-white rounded-md w-full border-t-1 border-gray-200 mt-auto">

                <EditorOptions
                    imageProperties={imageProperties}
                    setImageProperties={setImageProperties}
                    editsVisible={editsVisible}
                    setEditsVisible={setEditsVisible}
                    base={base}
                    onSave={handleSave}
                    onReset={handleReset}
                />

            </div>

        </div>
    )

};