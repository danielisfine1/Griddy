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

const findRow = ({
    post_id,
    posts,
  }: {
    post_id: string;
    posts: { id: string; order: number }[];
  }): ({ id: string; order: number; target: boolean })[] => {

    const sorted = [...posts].sort((a, b) => a.order - b.order);
  
    const rows: { id: string; order: number }[][] = [];

    for (let i = 0; i < sorted.length; i += 3) {
      rows.push(sorted.slice(i, i + 3));
    };
  
    const targetRow = rows.find((row) => row.some((p) => p.id === post_id));
  
    if (!targetRow) {
      return [];
    };
  
    return targetRow.map((p) => ({
      ...p,
      target: p.id === post_id,
    }));

};

const Index = async ({ params: unresolvedParams }: PageProps) => {

    const post_id = (await unresolvedParams).post_id;

    const supabase = await createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (user) {

        const { data: post, error: postError } = await supabase.from("posts")
            .select('id,grid_id')
            .eq("id", post_id)
            .single();

        if (postError) {
            console.error(postError);
            return <div className="font-xanh">Error fetching post</div>;
        };

        const gridId = post.grid_id;

        const { data: grid, error: gridError } = await supabase.from("posts").select("id,order").eq("grid_id", gridId);

        if (gridError) {
            console.error(gridError);
            return <div className="font-xanh">Error fetching grid</div>;
        };

        if (grid) {

            const row = findRow({ post_id, posts: grid });
            const ids = row.map((p) => p.id);

            const { data: rowPosts, error: rowPostsError } = await supabase
                .from("posts")
                .select(`id,grid_id,url,edited_url,brightness,contrast,saturation,hue,vignette_size,vignette_sharpness,sharpness,structure,lut,red_hue,red_saturation,red_lightness,orange_hue,orange_saturation,orange_lightness,yellow_hue,yellow_saturation,yellow_lightness,green_hue,green_saturation,green_lightness,blue_hue,blue_saturation,blue_lightness,magenta_hue,magenta_saturation,magenta_lightness,order`)
                .in("id", ids)
                .order("order", { ascending: true });

            if (rowPostsError) {
                console.error(rowPostsError);
                return <div className="font-xanh">Error fetching posts</div>;
            };

            const mainPost = rowPosts.find((p) => p.id === post_id);

            if (!mainPost) {
                return <div className="font-xanh">Post not found</div>;
            };

            const url = mainPost.url;

            const imageProperties: ImageProperties = {
                brightness: mainPost.brightness,
                contrast: mainPost.contrast,
                saturation: mainPost.saturation,
                hue: mainPost.hue,
                vignette_size: mainPost.vignette_size,
                vignette_sharpness: mainPost.vignette_sharpness,
                sharpness: mainPost.sharpness,
                structure: mainPost.structure,
                lut: mainPost.lut as LUT,

                red_hue: mainPost.red_hue,
                red_saturation: mainPost.red_saturation,
                red_lightness: mainPost.red_lightness,
                orange_hue: mainPost.orange_hue,
                orange_saturation: mainPost.orange_saturation,
                orange_lightness: mainPost.orange_lightness,
                yellow_hue: mainPost.yellow_hue,
                yellow_saturation: mainPost.yellow_saturation,
                yellow_lightness: mainPost.yellow_lightness,
                green_hue: mainPost.green_hue,
                green_saturation: mainPost.green_saturation,
                green_lightness: mainPost.green_lightness,
                blue_hue: mainPost.blue_hue,
                blue_saturation: mainPost.blue_saturation,
                blue_lightness: mainPost.blue_lightness,
                magenta_hue: mainPost.magenta_hue,
                magenta_saturation: mainPost.magenta_saturation,
                magenta_lightness: mainPost.magenta_lightness,

            };

            return (
                <Editor 
                    image={url}
                    postId={post_id} 
                    imageProperties={imageProperties}
                    row={rowPosts}
                />
            );

        } else {

            return (
                <Home />
            );

        };
    
    } else {

        return (
            <Home />
        );

    };

};

export default Index;