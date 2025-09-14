'use server';

import { createClient } from "@/utils/supabase/server";

export const renameGrid = async ({ grid_id, name }: { grid_id: string, name: string }) => {

    const supabase = await createClient();

    const { data: { user }} = await supabase.auth.getUser();

    if (!user) {
        return { data: null, error: { message: "User not found" } };
    };

    const { data, error } = await supabase.from("grids").update({ name }).eq("id", grid_id).eq("user_id", user.id).select().single();

    return { data, error };
    
};