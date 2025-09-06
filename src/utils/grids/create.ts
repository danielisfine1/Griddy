'use server';

import { createClient } from "@/utils/supabase/server";

export const createGrid = async ({ name }: { name: string }) => {

    const supabase = await createClient();

    const { data: { user }} = await supabase.auth.getUser();

    if (!user) {
        return { data: null, error: { message: "User not found" } };
    };

    const { data, error } = await supabase.from("grids").insert({ name, user_id: user.id }).select().single();

    return { data, error };
    
};