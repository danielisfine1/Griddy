"use client";

import React, { useState, useRef, useMemo, ChangeEvent } from "react";
import { Post } from "@/types/internal";
import axios, { AxiosResponse } from "axios";
import { createModal } from "@/utils/modalHelper";

import { Post as PostComponent } from "@/components/Post";

import { updateOrders } from "@/utils/grids/posts";

import { useGrid } from "@/context/gridContext";

import { Header } from "@/components/Header";

type UploadedFile = {
    fileName: string;
    publicUrl: string;
};

type UploadSuccess = {
    success: true;
    files: UploadedFile[];
};

type UploadFailure = {
    success: false;
    message: string;
};

type UploadResponse = UploadSuccess | UploadFailure;

const Uploader = ({ grid_id }: { grid_id: string }) => {

    const [files, setFiles] = useState<File[]>([]);
    const [uploading, setUploading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [uploaded, setUploaded] = useState<UploadedFile[] | null>(null);

    const onFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        const list = e.target.files;
        if (!list) {
            setFiles([]);
            return;
        }
        const next: File[] = Array.from(list);
        setFiles(next);
        setError(null);
        setUploaded(null);
    };

    const onUpload = async () => {

        if (files.length === 0 || uploading) return;
        setUploading(true);
        setError(null);
        setUploaded(null);

        const form = new FormData();

        files.forEach((f) => form.append("image", f, f.name));

        form.append('grid_id', grid_id);

        try {
            const res: AxiosResponse<UploadResponse> = await axios.post(
                "/api/v1/posts/upload",
                form,
                { headers: { "Content-Type": "multipart/form-data" } }
            );

            if (res.data.success) {
                setUploaded(res.data.files);
                setFiles([]);
                window.location.reload();
            } else {
                setError(res.data.message);
            };

        } catch (e) {

            console.log(e);
            setError("Upload failed. Please try again.");

        } finally {

            setUploading(false);

        };

    };

    return (
        <div className="w-full max-w-md p-6 rounded-xl flex flex-col gap-4">
            <h2 className="font-xanh text-xl">Upload images</h2>

            <input
                type="file"
                accept="image/*"
                multiple
                onChange={onFileChange}
                className="block w-full text-sm text-black/80 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border file:border-black/20 file:text-sm file:font-medium file:bg-white file:text-black hover:file:bg-black/5"
            />

            {files.length > 0 && (
                <ul className="text-sm text-black/70 max-h-40 overflow-auto list-disc pl-5">
                    {files.map((f) => (
                        <li key={`${f.name}-${f.size}`}>{f.name}</li>
                    ))}
                </ul>
            )}

            <button
                onClick={onUpload}
                disabled={files.length === 0 || uploading}
                className="rounded-md border border-black px-4 py-2 font-xanh disabled:opacity-50"
            >
                {uploading ? "Uploading…" : `Upload ${files.length || ""}`.trim()}
            </button>

            {uploaded && uploaded.length > 0 && (
                <div className="text-sm text-green-700">
                    Uploaded {uploaded.length} file{uploaded.length === 1 ? "" : "s"}.
                </div>
            )}
            {error && <div className="text-sm text-red-600">{error}</div>}
        </div>
    );
};

export const GridContents = () => {

    const { grid, posts, setPosts } = useGrid();

    const [draggingId, setDraggingId] = useState<string | null>(null);
    const dragFromIndex = useRef<number | null>(null);

    const handleAddNewPost = async () => {
        await createModal(<Uploader grid_id={grid.id} />);
    };

    /* Reorder helper */
    const reorder = (list: Post[], start: number, end: number) => {
        if (start === end) return list;
        const next = list.slice();
        const [moved] = next.splice(start, 1);
        next.splice(end, 0, moved);
        return next;
    };

    /* Handlers */
    const onDragStart = (e: React.DragEvent<HTMLButtonElement>) => {
        const idx = Number(e.currentTarget.dataset.index);
        dragFromIndex.current = idx;
        setDraggingId(e.currentTarget.dataset.id || null);
        /* allow move cursor */
        e.dataTransfer.effectAllowed = "move";
        /* needed for Firefox to initiate DnD */
        e.dataTransfer.setData("text/plain", e.currentTarget.dataset.id || "");
    };

    const onDragOver = (e: React.DragEvent<HTMLButtonElement>) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
    };

    const onDrop = (e: React.DragEvent<HTMLButtonElement>) => {
        e.preventDefault();
        const from = dragFromIndex.current;
        const to = Number(e.currentTarget.dataset.index);
        if (from == null || Number.isNaN(to)) {
            setDraggingId(null);
            dragFromIndex.current = null;
            return;
        }
        setPosts((prev) => reorder(prev, from, to));
        setDraggingId(null);
        dragFromIndex.current = null;
    };

    const onDragEnd = async () => {

        setDraggingId(null);
        dragFromIndex.current = null;
      
        const prevPosts = [...posts];
      
        const withOrder = posts.map((p, i) => ({ ...p, order: i + 1 }));
      
        const { error } = await updateOrders({ grid_id: grid.id, orders: withOrder });
      
        if (error) {
          console.error("Update failed, reverting", error);
          setPosts(prevPosts);
        };

    };

    /* Optional: tighten gutters on small screens */
    const gridClass = useMemo(
        () => "grid grid-cols-3 gap-[2px] md:gap-[3px]",
    []);

    return (
        <div className="font-xanh w-full min-h-screen flex flex-col justify-start items-center gap-6 p-4">

            <Header
                links={[
                    {
                        name: "Home",
                        href: "/",
                    },
                    {
                        name: "Sign out",
                        href: "/signout",
                    },
                ]}
            />

            <h1 className="font-xanh text-4xl mt-4">{grid.name}</h1>

            <button
                type="button"
                onClick={handleAddNewPost}
                className="font-xanh text-2xl underline"
            >
                Add new post
            </button>

            <div className="w-full">
                <div className={gridClass}>
                    {posts.map((post, index) => (
                        <PostComponent
                            key={post.id}
                            
                            /* custom props */
                            post={post}
                            index={index}
                            draggingId={draggingId}
                            
                            /* native attributes */
                            type="button"
                            data-id={post.id}
                            data-index={index}
                            draggable
                            
                            /* event handlers */
                            onDragStart={onDragStart}
                            onDragOver={onDragOver}
                            onDrop={onDrop}
                            onDragEnd={onDragEnd}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
};