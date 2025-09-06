"use client";

import React, { createContext, useContext, useState } from "react";
import type { Grid } from "@/types/internal";

type GridContextType = {
    grid: Grid;
    setGrid: React.Dispatch<React.SetStateAction<Grid>>;
    posts: Grid["posts"];
    setPosts: React.Dispatch<React.SetStateAction<Grid["posts"]>>;
};

const GridContext = createContext<GridContextType | undefined>(undefined);

export const GridProvider: React.FC<{ children: React.ReactNode, grid: Grid }> = ({ children, grid: initialGrid }) => {

    const [grid, setGrid] = useState<Grid>(initialGrid);
    const [posts, setPosts] = useState<Grid["posts"]>(initialGrid.posts);

    return (
        <GridContext.Provider value={{ grid, setGrid, posts, setPosts }}>
            {children}
        </GridContext.Provider>
    );
    
};

export const useGrid = () => {
    const ctx = useContext(GridContext);
    if (!ctx) throw new Error("useGrid must be used within a GridProvider");
    return ctx;
};
