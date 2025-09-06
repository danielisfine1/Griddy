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

export const Dashboard = ({ grids }: { grids: Grid[] }) => {


    const handleAddNewGrid = async () => {

        await createModal(<AddNewGrid />);

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

            <div className="w-full grid grid-cols-3 gap-10">
                {grids.map((grid: Grid) => {
                    return (
                        <a key={grid.id} className="border-1 border-black rounded-md flex flex-col justify-center items-center gap-5 p-10" href={`/grid/${grid.id}`}>

                            <h3>{grid.name}</h3>
                            <p>{grid.posts.length} post{grid.posts.length === 1 ? "" : "s"}</p>

                            <div className="w-full grid grid-cols-3 gap-1">
                                {grid.posts.slice(0, 6).map((post, i) => (
                                    <div key={i} className="relative w-full h-24">
                                    <Image
                                        src={post.url}
                                        alt={post.id}
                                        fill
                                        className="object-cover"
                                    />
                                    </div>
                                ))}
                            </div>

                        </a>
                    );
                })}
            </div>

        </div>
    );

};