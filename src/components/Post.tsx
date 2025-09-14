'use client';

import React from "react";
import Image from "next/image";
import { twMerge } from "tailwind-merge";
import { Menu, MenuItem, Fade } from "@mui/material";

import { useGrid } from "@/context/gridContext";
import { deletePost } from "@/utils/grids/posts";
import { fetchGrid } from "@/utils/grids/fetch";
import { createModal } from "@/utils/modalHelper";

/* ---------- Post with Edit/Delete ---------- */
export type PostProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
    post: { id: string; url: string; edited_url: string | null };
    index: number;
    className?: string;
};

export const Post: React.FC<PostProps> = ({ post, index, className, ...props }) => {
    const { grid, setPosts } = useGrid();

    const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
    const open = Boolean(anchorEl);

    const handleClick = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => setAnchorEl(null);

    const handleDelete = async () => {
        const modal = await createModal(<div>Deleting...</div>);

        const { error } = await deletePost({ id: post.id });
        const { data: updatedGrid } = await fetchGrid({ id: grid.id });

        if (!error && updatedGrid) {
            setPosts(updatedGrid.posts);
            modal.set(<div>Deleted post {post.id}</div>);
            setTimeout(modal.close, 1000);
        }

        handleClose();
    };

    return (
        <>
            <button
                key={post.id}
                type="button"
                data-id={post.id}
                data-index={index}
                className={twMerge(
                    "relative block w-full aspect-[4/5] overflow-hidden select-none",
                    "bg-neutral-100 focus:outline-none",
                    className
                )}
                onClick={handleClick}
                {...props}
            >
                <div className="relative w-full h-full">
                    <Image
                        src={post.edited_url || post.url}
                        alt=""
                        fill
                        className="object-cover"
                        loading="lazy"
                    />
                </div>
            </button>

            <Menu
                slots={{ transition: Fade }}
                anchorEl={anchorEl}
                open={open}
                onClose={handleClose}
            >
                <MenuItem onClick={() => (window.location.href = `/edit/${post.id}`)}>
                    Edit
                </MenuItem>
                <MenuItem onClick={handleDelete}>Delete</MenuItem>
            </Menu>
        </>
    );
};

/* ---------- Draggable wrapper (adds dragging visuals) ---------- */
type DraggablePostProps = PostProps & {
    draggingId: string | null;
};

export const DraggablePost: React.FC<DraggablePostProps> = ({
    draggingId,
    ...props
}) => {
    return (
        <Post
            {...props}
            className={twMerge(
                props.className,
                draggingId === props.post.id && "opacity-60 ring-2 ring-black/30"
            )}
        />
    );
};
