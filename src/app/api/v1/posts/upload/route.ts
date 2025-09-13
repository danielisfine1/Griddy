import { NextResponse } from 'next/server';
import { createClient } from "@/utils/supabase/server";

import { uploadPost } from '@/utils/uploadPost';

export async function POST(request: Request) {

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json(
            { success: false, message: 'User not found' },
            { status: 401 }
        );
    };

    try {

        const formData = await request.formData();

        const inputs = [
            ...formData.getAll('image'),
            ...formData.getAll('images'),
        ];

        const gridId = formData.get('grid_id');

        const files = inputs.filter((v): v is File => v instanceof File);

        if (files.length === 0) {
            return NextResponse.json(
                { success: false, message: 'No image uploaded' },
                { status: 400 }
            );
        };

        const uploaded: { fileName: string; publicUrl: string }[] = [];

        for (const file of files) {

            try {

                const { fileName, publicUrl } = await uploadPost({ supabase, user, file });
                uploaded.push({ fileName, publicUrl: publicUrl });

            } catch (error) {

                console.log(error);
                return NextResponse.json(
                    { success: false, message: `Image upload failed for ${file.name}` },
                    { status: 500 }
                );

            };

        };
        
        const { error: insertError } = await supabase
            .from('posts')
            .insert(
                uploaded.map((f) => ({
                    user_id: user.id,
                    grid_id: gridId as string,
                    url: f.publicUrl,
                }))
            );

        if (insertError) {
            console.log(insertError);
            return NextResponse.json(
                { success: false, message: 'Database error' },
                { status: 500 }
            );
        };

        return NextResponse.json(
            { success: true, files: uploaded },
            { status: 200 }
        );

    } catch (error: unknown) {
        console.error('Server error:', error);
        return NextResponse.json(
            { success: false, message: 'Internal server error' },
            { status: 500 }
        );
    };
};
