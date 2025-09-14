'use server';

import { createClient } from "@/utils/supabase/server";

import { base } from "@/components/editor/constants";

export const deletePost = async ({ id }: { id: string }) => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { data: null, error: { message: "User not found" } };
  }

  const { data: post, error: fetchError } = await supabase
    .from("posts")
    .select("id, url, edited_url")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (fetchError || !post) {
    return { data: null, error: fetchError || { message: "Post not found" } };
  }

  // Collect file paths (original + edited if present)
  const filesToDelete: string[] = [];

  function extractPath(fileUrl: string | null) {
    if (!fileUrl) return null;
    try {
      const url = new URL(fileUrl);
      const pathname = url.pathname;
      return pathname.split("/storage/v1/object/public/posts/")[1] || null;
    } catch {
      return null;
    }
  }

  const originalPath = extractPath(post.url);
  if (originalPath) filesToDelete.push(originalPath);

  const editedPath = extractPath(post.edited_url);
  if (editedPath) filesToDelete.push(editedPath);

  if (filesToDelete.length > 0) {
    const { error: storageError } = await supabase.storage
      .from("posts")
      .remove(filesToDelete);

    if (storageError) {
      return { data: null, error: storageError };
    }
  }

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

export const resetPost = async ({ id }: { id: string }) => {

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { data: null, error: { message: "User not found" } };
  };

  /* Fetch the post with edited_url */
  const { data: post, error: fetchError } = await supabase
    .from("posts")
    .select("id, edited_url")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (fetchError || !post) {
    return { data: null, error: fetchError || { message: "Post not found" } };
  };

  /* If there’s an edited_url, remove it from storage */

  if (post.edited_url) {

    try {

      const url = new URL(post.edited_url);
      const pathname = url.pathname;
      const filePath = pathname.split("/storage/v1/object/public/posts/")[1];

      if (filePath) {

        const { error: storageError } = await supabase.storage.from("posts").remove([filePath]);

        if (storageError) {
          return { data: null, error: storageError };
        };

      };

    } catch (err) {

      console.error("Invalid edited_url format", err);
      return { data: null, error: { message: "Invalid edited_url format" } };

    };

  };

  /* Reset edited_url to NULL in the database */
  
  const { data, error: updateError } = await supabase
    .from("posts")
    .update({
      edited_url: null,
      ...base
    })
    .eq("id", id)
    .eq("user_id", user.id)
    .select()
    .single();

  if (updateError) {
    console.log(updateError);
    return { data: null, error: updateError };
  };

  return { data, error: null };

};
