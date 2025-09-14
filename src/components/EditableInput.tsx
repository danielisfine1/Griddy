'use client';

import { useState } from "react";
import { IconButton, TextField } from "@mui/material";
import { TiPencil } from "react-icons/ti";
import { FaRegSave } from "react-icons/fa";
import { VscDiscard } from "react-icons/vsc";

type EditableTags = "p" | "label" | "h1" | "h2" | "h3" | "h4" | "h5" | "h6";

interface EditableInputProps {
    element: EditableTags;
    elementProps?: React.HTMLAttributes<HTMLElement>;
    onSave: (newValue: string) => Promise<{ success: boolean }>;
    initialValue: string;
}

export const EditableInput = ({
    element,
    elementProps,
    onSave,
    initialValue,
}: EditableInputProps) => {

    const [isEditing, setIsEditing] = useState(false);
    const [value, setValue] = useState(initialValue);
    const [pendingValue, setPendingValue] = useState(initialValue);

    async function handleSave() {
        const result = await onSave(pendingValue);
        if (result.success) {
            setValue(pendingValue);
        } else {
            setPendingValue(value);
        }
        setIsEditing(false);
    }

    function handleDiscard() {
        setPendingValue(value);
        setIsEditing(false);
    }

    function renderElement(text: string) {
        switch (element) {
            case "p":
                return <p {...elementProps}>{text}</p>;
            case "label":
                return <label {...elementProps}>{text}</label>;
            case "h1":
                return <h1 {...elementProps}>{text}</h1>;
            case "h2":
                return <h2 {...elementProps}>{text}</h2>;
            case "h3":
                return <h3 {...elementProps}>{text}</h3>;
            case "h4":
                return <h4 {...elementProps}>{text}</h4>;
            case "h5":
                return <h5 {...elementProps}>{text}</h5>;
            case "h6":
                return <h6 {...elementProps}>{text}</h6>;
            default:
                return <span>{text}</span>;
        };
    };

    return (
        <div className="flex items-center gap-2">
            {isEditing ? (
                <>
                    <TextField
                        size="small"
                        variant="outlined"
                        value={pendingValue}
                        onChange={(e) => setPendingValue(e.target.value)}
                        autoFocus
                        onKeyDown={(e) => {
                            if (e.key === "Enter") handleSave();
                            if (e.key === "Escape") handleDiscard();
                        }}
                    />
                    <IconButton size="small" onClick={handleSave}>
                        <FaRegSave className="text-green-600" />
                    </IconButton>
                    <IconButton size="small" onClick={handleDiscard}>
                        <VscDiscard className="text-red-600" />
                    </IconButton>
                </>
            ) : (
                <>
                    {renderElement(value)}
                    <IconButton size="small" onClick={() => setIsEditing(true)}>
                        <TiPencil className="text-gray-600" />
                    </IconButton>
                </>
            )}
        </div>
    );
};
