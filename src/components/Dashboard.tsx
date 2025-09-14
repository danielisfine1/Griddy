'use client';

import { useState } from "react";
import { createModal } from "@/utils/modalHelper";

import { createGrid } from "@/utils/grids/create";

import { TextField, Button } from "@mui/material";

import { Grid } from "@/types/internal";

import { Header } from "@/components/Header";

import Image from "next/image";

export const AddNewGrid = () => {

    const [name, setName] = useState("");
    const [creating, setCreating] = useState<boolean>(false);
    const [succesfullyCreated, setSuccesfullyCreated] = useState<boolean | null>(null);

    const handleCreateGrid = async () => {

        setCreating(true);

        const { data, error } = await createGrid({ name });

        if (error) {

            console.error(error);
            setCreating(false);
            setSuccesfullyCreated(false);

        } else if (data) {

            setCreating(false);
            setSuccesfullyCreated(true);

            window.location.href = `/grid/${data.id}`;

        };

    };

    return (
        <div className="flex flex-col gap-5">
            <TextField value={name} onChange={(e) => setName(e.target.value)}></TextField>
            {
                creating ? (
                    <Button disabled>Creating</Button>
                ) : (
                    <Button onClick={handleCreateGrid}>Create</Button>
                )
            }
        </div>
    );

};

import { renameGrid } from "@/utils/grids/edit";
import { EditableInput } from "@/components/EditableInput";

export const Dashboard = ({ grids }: { grids: Grid[] }) => {


    const handleAddNewGrid = async () => {

        await createModal(<AddNewGrid />);

    };

    const handleRenameGrid = async ({ grid_id, name }: { grid_id: string, name: string }) => {

        const { data, error } = await renameGrid({ grid_id, name });

        if (error) {
            console.error(error);
            return { success: false };
        } else {
            return { success: true };
        };

    };

    return (
        <div className="font-xanh w-full h-screen flex flex-col items-center gap-10 p-10">

            <Header
            
                links={[
                    {
                        name: "Sign out",
                        href: "/signout",
                    },
                ]}
            
            />

            <a className="cursor-pointer text-2xl" onClick={handleAddNewGrid}>Add new grid</a>

            <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-10">
                {grids.map((grid: Grid) => {
                    return (
                        <div key={grid.id} className="border-1 border-black rounded-md flex flex-col justify-center items-center gap-5 p-10">
                            
                            <EditableInput
                                initialValue={grid.name}
                                element="h2"
                                elementProps={{ className: "text-2xl" }}
                                onSave={(value) => handleRenameGrid({ grid_id: grid.id, name: value })}
                            />

                            <p>{grid.posts.length} post{grid.posts.length === 1 ? "" : "s"}</p>

                            <a href={`/grid/${grid.id}`} className="w-full grid grid-cols-3 gap-1">
                                {grid.posts.slice(0, 6).map((post, i) => (
                                    <div key={i} className="relative w-full h-24">
                                    <Image
                                        src={post.edited_url || post.url}
                                        alt={post.id}
                                        fill
                                        className="object-cover"
                                    />
                                    </div>
                                ))}
                            </a>

                        </div>
                    );
                })}
            </div>

        </div>
    );

};