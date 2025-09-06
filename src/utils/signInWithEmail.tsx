import { createClient } from "@/utils/supabase/client";

export async function signInWithEmail({ email, password }: { email: string, password: string}) {

    const supabase = await createClient();

    const res = await supabase.auth.signInWithPassword({
        email: email,
        password: password
    });

    return res;

};