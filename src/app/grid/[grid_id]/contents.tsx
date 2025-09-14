"use client";

import React, { useState, useMemo, ChangeEvent } from "react";
import { Post } from "@/types/internal";
import axios, { AxiosResponse } from "axios";
import { createModal } from "@/utils/modalHelper";
import { DraggablePost } from "@/components/Post";
import { updateOrders } from "@/utils/grids/posts";
import { useGrid } from "@/context/gridContext";
import { Header } from "@/components/Header";

/* dnd-kit */
import {
    DndContext,
    closestCenter,
    PointerSensor,
    TouchSensor,
    MouseSensor,
    useSensor,
    useSensors,
    DragStartEvent,
    DragEndEvent,
} from "@dnd-kit/core";
import {
    SortableContext,
    useSortable,
    rectSortingStrategy,
    arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

type UploadedFile = { fileName: string; publicUrl: string };
type UploadSuccess = { success: true; files: UploadedFile[] };
type UploadFailure = { success: false; message: string };
type UploadResponse = UploadSuccess | UploadFailure;

const Uploader = ({ grid_id }: { grid_id: string }) => {
    const [files, setFiles] = useState<File[]>([]);
    const [uploading, setUploading] = useState(false);
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
        form.append("grid_id", grid_id);

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
            }
        } catch (e) {
            console.log(e);
            setError("Upload failed. Please try again.");
        } finally {
            setUploading(false);
        }
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

/* Sortable item wrapper: attaches sensors, supports hold-to-drag on mobile */
const SortablePost = ({
    post,
    index,
    activeId,
}: {
    post: Post;
    index: number;
    activeId: string | null;
}) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
        useSortable({ id: post.id });

    const style: React.CSSProperties = {
        transform: CSS.Transform.toString(transform),
        transition,
        touchAction: "none", // prevent scrolling while dragging
        WebkitTapHighlightColor: "transparent",
        WebkitTouchCallout: "none",
        userSelect: "none",
        opacity: isDragging ? 0.6 : 1,
    };

    return (
        <div ref={setNodeRef} style={style} className="relative">
            <DraggablePost
                /* custom props */
                post={post}
                index={index}
                draggingId={activeId}

                /* make the whole tile the drag handle */
                {...attributes}
                {...listeners}
                onContextMenu={(e) => e.preventDefault()} // iOS long-press menu
                type="button"
            />
        </div>
    );
};

export const GridContents = () => {
    const { grid, posts, setPosts } = useGrid();
    const [activeId, setActiveId] = useState<string | null>(null);

    /* Sensors: Pointer (modern), Touch (fallback), Mouse */
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                delay: 300,     // hold-to-drag (ms)
                tolerance: 6,   // allowed finger movement during hold (px)
            },
        })
    );

    const handleAddNewPost = async () => {
        await createModal(<Uploader grid_id={grid.id} />);
    };

    const items = useMemo(() => posts.map((p) => p.id), [posts]);

    const onDragStart = (event: DragStartEvent) => {
        setActiveId(String(event.active.id));
    };

    const onDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveId(null);

        if (!over || active.id === over.id) return;

        const oldIndex = posts.findIndex((p) => p.id === active.id);
        const newIndex = posts.findIndex((p) => p.id === over.id);
        if (oldIndex < 0 || newIndex < 0) return;

        const prev = posts;
        const next = arrayMove(posts, oldIndex, newIndex);

        /* optimistic UI */
        setPosts(next);

        /* persist */
        const withOrder = next.map((p, i) => ({ ...p, order: i + 1 }));
        const { error } = await updateOrders({ grid_id: grid.id, orders: withOrder });

        if (error) {
            console.error("Update failed, reverting", error);
            setPosts(prev);
        }
    };

    const gridClass = useMemo(
        () => "grid grid-cols-3 gap-[2px] md:gap-[3px]",
        []
    );

    return (
        <div className="font-xanh w-full min-h-screen flex flex-col justify-start items-center gap-6 p-4">
            <Header
                links={[
                    { name: "Home", href: "/" },
                    { name: "Sign out", href: "/signout" },
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
                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragStart={onDragStart}
                    onDragEnd={onDragEnd}
                >
                    <SortableContext items={items} strategy={rectSortingStrategy}>
                        <div className={gridClass}>
                            {posts.map((post, index) => (
                                <SortablePost
                                    key={post.id}
                                    post={post}
                                    index={index}
                                    activeId={activeId}
                                />
                            ))}
                        </div>
                    </SortableContext>
                </DndContext>
            </div>
        </div>
    );
};
