"use server";

import { createClient } from "@/utils/supabase/server";

import { z } from 'zod';

const emailSchema = z.string().email();

export const createAccount = async (email: string, password: string) => {

    const isValid = emailSchema.safeParse(email).success;

    if (!isValid) {
        return { data: null, error: { message: "Invalid email" } };
    };
    
    const supabase = await createClient();

    return await supabase.auth.signUp(
        {
            email: email,
            password: password
        }
    );

};