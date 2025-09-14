'use client';

import { useState } from "react";
import { IconButton } from "@mui/material";
import { FaCircle } from "react-icons/fa";
import { twMerge } from "tailwind-merge";

import { LinearInput } from "@/components/editor/inputs/LinearInput";
import type { ImageProperties } from "@/components/editor/types";

type Color = "red" | "orange" | "yellow" | "green" | "blue" | "magenta";
type Channel = "hue" | "saturation" | "lightness";
type ColorKey = `${Color}_${Channel}`;
type SafeKey = Extract<keyof ImageProperties, ColorKey>;

const COLOR_OPTIONS: ReadonlyArray<{ id: Color; tw: string; label: string }> = [
    { id: "red", tw: "text-red-500", label: "Red" },
    { id: "orange", tw: "text-orange-500", label: "Orange" },
    { id: "yellow", tw: "text-yellow-500", label: "Yellow" },
    { id: "green", tw: "text-green-500", label: "Green" },
    { id: "blue", tw: "text-blue-500", label: "Blue" },
    { id: "magenta", tw: "text-fuchsia-500", label: "Magenta" },
];

export const ColorsInput = ({
    imageProperties,
    setImageProperties,
}: {
    imageProperties: ImageProperties;
    setImageProperties: React.Dispatch<React.SetStateAction<ImageProperties>>;
}) => {
    const [active, setActive] = useState<Color>("red");

    const makeKey = (c: Color, ch: Channel) => (`${c}_${ch}` as SafeKey);

    const getVal = (key: SafeKey) => imageProperties[key] as number;

    const setVal = (key: SafeKey, value: number) => {
        console.log(key, value);
        setImageProperties(prev => ({ ...prev, [key]: value }));
    };

    const hueKey = makeKey(active, "hue");
    const satKey = makeKey(active, "saturation");
    const lightnessKey = makeKey(active, "lightness");

    return (
        <div className="flex flex-col w-full gap-4">
            {/* Color picker row */}
            <div className="w-full flex justify-between items-center gap-2">
                {COLOR_OPTIONS.map(({ id, tw, label }) => {
                    const selected = id === active;
                    return (
                        <IconButton
                            key={id}
                            onClick={() => setActive(id)}
                            aria-label={label}
                            aria-pressed={selected}
                            className={twMerge(
                                "transition transform",
                                selected && "ring-2 ring-offset-2 ring-black/30 scale-105"
                            )}
                            size="small"
                        >
                            <FaCircle className={twMerge("text-2xl", tw)} />
                        </IconButton>
                    );
                })}
            </div>

            {/* Sliders */}
            <div className="flex flex-col gap-3">
                <div className="flex items-center gap-3">
                    <div className="w-24 text-sm text-gray-600">Hue</div>
                    <LinearInput
                        value={getVal(hueKey)}
                        onChange={(_, v) => setVal(hueKey, v as number)}
                        min={-0.5}
                        max={0.5}
                        step={0.001}
                    />
                </div>
                <div className="flex items-center gap-3">
                    <div className="w-24 text-sm text-gray-600">Saturation</div>
                    <LinearInput
                        value={getVal(satKey)}
                        onChange={(_, v) => setVal(satKey, v as number)}
                        min={-0.5}
                        max={0.5}
                        step={0.001}
                    />
                </div>
                <div className="flex items-center gap-3">
                    <div className="w-24 text-sm text-gray-600">Lightness</div>
                    <LinearInput
                        value={getVal(lightnessKey)}
                        onChange={(_, v) => setVal(lightnessKey, v as number)}
                        min={-0.5}
                        max={0.5}
                        step={0.001}
                    />
                </div>
            </div>
        </div>
    );
};
