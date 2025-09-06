// theme.ts
"use client";

import { createTheme } from "@mui/material/styles";

export const theme = createTheme({
    palette: {
        mode: "dark",
        background: {
            default: "#000000",
            paper: "#FFFFFF",
        },
        text: {
            primary: "#000000",
            secondary: "#aaaaaa",
        },
        primary: {
            main: "#000000",
        },
        secondary: {
            main: "#888888",
        },
    },
    typography: {
        fontFamily: "var(--font-xanh), monospace",
    },
});
