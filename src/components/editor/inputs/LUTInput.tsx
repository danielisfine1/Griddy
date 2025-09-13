"use client";

import { useState } from "react";
import { Button, Menu, MenuItem } from "@mui/material";

import { options } from "@/components/editor/luts";
import type { LUT } from "@/components/editor/luts";

export const LUTInput = ({
    value,
    onChange,
}: {
    value: LUT;
    onChange: (value: LUT) => void;
}) => {
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

    const handleOpen = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const handleSelect = (newValue: LUT) => {
        onChange(newValue);
        handleClose();
    };

    const currentLabel =
        options.find((opt) => opt.value === value)?.name ?? "Select LUT";

    return (
        <div className="w-full h-full flex items-center">
            <Button
                aria-controls="lut-menu"
                aria-haspopup="true"
                onClick={handleOpen}
                variant="outlined"
                className="w-full"
            >
                {currentLabel}
            </Button>
            <Menu
                id="lut-menu"
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleClose}
            >
                {options.map((option) => (
                    <MenuItem
                        key={option.value ?? "null"}
                        selected={value === option.value}
                        onClick={() => handleSelect(option.value)}
                    >
                        {option.name}
                    </MenuItem>
                ))}
            </Menu>
        </div>
    );
};
