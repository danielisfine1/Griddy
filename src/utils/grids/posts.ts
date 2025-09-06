'use server';

import { createClient } from "@/utils/supabase/server";

export const deletePost = async ({ id }: { id: string }) => {

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
  
    if (!user) {
      return { data: null, error: { message: "User not found" } };
    };
  
    const { data: post, error: fetchError } = await supabase
      .from("posts")
      .select("id, url")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();
  
    if (fetchError || !post) {
      return { data: null, error: fetchError || { message: "Post not found" } };
    };
  
    const url = new URL(post.url);
    const pathname = url.pathname;
    const filePath = pathname.split("/storage/v1/object/public/posts/")[1];
  
    if (!filePath) {
      return { data: null, error: { message: "Could not derive storage path" } };
    };
  
    const { error: storageError } = await supabase.storage
      .from("posts")
      .remove([filePath]);
  
    if (storageError) {
      return { data: null, error: storageError };
    };
  
    const { data, error } = await supabase
      .from("posts")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id)
      .select()
      .single();
  
    return { data, error };
    
};

interface updateOrdersArgs {
    grid_id: string;
    orders: {
        id: string;
        order: number;
    }[];
};

export const updateOrders = async ({ grid_id, orders }: updateOrdersArgs) => {

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
  
    if (!user) {
      return { data: null, error: { message: "User not found" } };
    };
  
    const { data, error } = await supabase.rpc("update_post_orders", {
      p_user_id: user.id,
      p_grid_id: grid_id,
      p_orders: orders
    });
  
    return { data, error };

};