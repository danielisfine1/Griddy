import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { uploadPost } from "@/utils/uploadPost";

export async function POST(request: Request) {
    const supabase = await createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json(
            { success: false, message: "User not found" },
            { status: 401 }
        );
    };

    try {
        const formData = await request.formData();

        const file = formData.get("image");
        const postIdEntry = formData.get("post_id");

        /* 🎨 Image properties */

        const brightness = Number(formData.get("brightness"));
        const contrast = Number(formData.get("contrast"));
        const saturation = Number(formData.get("saturation"));
        const hue = Number(formData.get("hue"));
        const vignette_size = Number(formData.get("vignette_size"));
        const vignette_sharpness = Number(formData.get("vignette_sharpness"));
        const sharpness = Number(formData.get("sharpness"));
        const structure = Number(formData.get("structure"));
        const lut = String(formData.get("lut"));

        const red_hue = Number(formData.get("red_hue"));
        const red_saturation = Number(formData.get("red_saturation"));
        const red_lightness = Number(formData.get("red_lightness"));
        const orange_hue = Number(formData.get("orange_hue"));
        const orange_saturation = Number(formData.get("orange_saturation"));
        const orange_lightness = Number(formData.get("orange_lightness"));
        const yellow_hue = Number(formData.get("yellow_hue"));
        const yellow_saturation = Number(formData.get("yellow_saturation"));
        const yellow_lightness = Number(formData.get("yellow_lightness"));
        const green_hue = Number(formData.get("green_hue"));
        const green_saturation = Number(formData.get("green_saturation"));
        const green_lightness = Number(formData.get("green_lightness"));
        const blue_hue = Number(formData.get("blue_hue"));
        const blue_saturation = Number(formData.get("blue_saturation"));
        const blue_lightness = Number(formData.get("blue_lightness"));
        const magenta_hue = Number(formData.get("magenta_hue"));
        const magenta_saturation = Number(formData.get("magenta_saturation"));
        const magenta_lightness = Number(formData.get("magenta_lightness"));

        if (!(file instanceof File)) {
            return NextResponse.json(
                { success: false, message: "No image uploaded" },
                { status: 400 }
            );
        }

        if (typeof postIdEntry !== "string") {
            return NextResponse.json(
                { success: false, message: "post_id is required" },
                { status: 400 }
            );
        }

        const postId = postIdEntry;

        /* 🔎 Fetch the current post to check for existing edited_url */
        const { data: post, error: fetchError } = await supabase
            .from("posts")
            .select("edited_url")
            .eq("id", postId)
            .single();

        if (fetchError) {
            console.error(fetchError);
            return NextResponse.json(
                { success: false, message: "Could not fetch post" },
                { status: 500 }
            );
        }

        /* 🗑️ Delete old edited image if it exists */
        if (post?.edited_url) {
            try {
                const url = new URL(post.edited_url);
                const filePath = url.pathname.split(
                    "/storage/v1/object/public/posts/"
                )[1];

                if (filePath) {
                    const { error: removeError } = await supabase.storage
                        .from("posts")
                        .remove([filePath]);

                    if (removeError) {
                        console.error("Storage delete error:", removeError);
                    }
                }
            } catch (err) {
                console.error("Error cleaning old edited file:", err);
            }
        }

        /* 📤 Upload new file */
        const { publicUrl } = await uploadPost({ supabase, user, file });

        /* 📝 Update DB */
        const { error: updateError } = await supabase
            .from("posts")
            .update({ 
                edited_url: publicUrl,
                brightness: brightness || 100,
                contrast: contrast || 100,
                saturation: saturation || 100,
                hue: hue || 0,
                vignette_size: vignette_size || 0,
                vignette_sharpness: vignette_sharpness || 0,
                sharpness: sharpness || 0,
                structure: structure || 0,

                red_hue: red_hue || 0,
                red_saturation: red_saturation || 0,
                red_lightness: red_lightness || 0,
                orange_hue: orange_hue || 0,
                orange_saturation: orange_saturation || 0,
                orange_lightness: orange_lightness || 0,
                yellow_hue: yellow_hue || 0,
                yellow_saturation: yellow_saturation || 0,
                yellow_lightness: yellow_lightness || 0,
                green_hue: green_hue || 0,
                green_saturation: green_saturation || 0,
                green_lightness: green_lightness || 0,
                blue_hue: blue_hue || 0,
                blue_saturation: blue_saturation || 0,
                blue_lightness: blue_lightness || 0,
                magenta_hue: magenta_hue || 0,
                magenta_saturation: magenta_saturation || 0,
                magenta_lightness: magenta_lightness || 0,

                lut
            })
            .eq("id", postId);

        if (updateError) {
            console.log(updateError);
            return NextResponse.json(
                { success: false, message: "Database update error" },
                { status: 500 }
            );
        }

        return NextResponse.json(
            { success: true, edited_url: publicUrl },
            { status: 200 }
        );
    } catch (error: unknown) {
        console.error("Server error:", error);
        return NextResponse.json(
            { success: false, message: "Internal server error" },
            { status: 500 }
        );
    };
};