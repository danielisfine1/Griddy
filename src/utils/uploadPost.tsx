import { SupabaseClient, User } from "@supabase/supabase-js";

export const uploadPost = async ({ supabase, user, file }: { supabase: SupabaseClient, user: User, file: File }) => {

    const randomFileName = Math.random().toString(36).substring(2, 9);
    const nameParts = file.name.split('.');
    const fileExtension = nameParts.length > 1 ? nameParts.pop() as string : 'bin';
    const fileName = `${user.id}/${randomFileName}.${fileExtension}`;

    const { error: uploadError } = await supabase.storage
        .from('posts')
        .upload(fileName, file, {
            upsert: true,
            contentType: file.type || 'application/octet-stream',
        });

    if (uploadError) {

        console.log(uploadError);
        throw new Error(uploadError.message);

    };

    const { data } = supabase.storage
        .from('posts')
        .getPublicUrl(fileName);

    return {
        fileName,
        publicUrl: data.publicUrl,
        success: true,
        message: null
    };

};