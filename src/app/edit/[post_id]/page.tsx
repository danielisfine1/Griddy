import { Home } from "@/app/contents";
import { Editor } from "@/components/editor/Editor";

import { createClient } from "@/utils/supabase/server";

import { ImageProperties } from "@/components/editor/types";
import { LUT } from "@/components/editor/luts";

type PageProps = {
    params: Promise<{
        post_id: string;
    }>;
};

const Index = async ({ params: unresolvedParams }: PageProps) => {

    const post_id = (await unresolvedParams).post_id;

    const supabase = await createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (user) {


        const { data, error } = await supabase.from("posts")
            .select('id,url,edited_url,brightness,contrast,saturation,hue,vignette_size,vignette_sharpness,sharpness,structure,lut')
            .eq("id", post_id)
            .single();

        if (error) {
            console.error(error);
            return <div className="font-xanh">Error fetching post</div>;
        };

        const url = data.url;

        const imageProperties: ImageProperties = {
            brightness: data.brightness,
            contrast: data.contrast,
            saturation: data.saturation,
            hue: data.hue,
            vignette_size: data.vignette_size,
            vignette_sharpness: data.vignette_sharpness,
            sharpness: data.sharpness,
            structure: data.structure,
            lut: data.lut as LUT
        };

        return (
            <Editor 
                image={url}
                postId={post_id} 
                imageProperties={imageProperties}
            />
        )
    
    } else {

        return (
            <Home />
        );

    };

};

export default Index;