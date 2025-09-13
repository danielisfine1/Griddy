'use server';

import { Grid } from "@/types/internal";

import { createClient } from "@/utils/supabase/server";

import { PostgrestError } from "@supabase/supabase-js";

export const fetchGrid = async ({ id }: { id: string }) => {

  const supabase = await createClient();

  const { data: { user }} = await supabase.auth.getUser();

  if (!user) {
    return { data: null, error: { message: "User not found" } };
  };

  const { data, error } = await supabase.rpc('get_grids_with_posts', {
    p_user_id: user.id,
  }).eq('id', id).single();

  return { data, error } as { data: Grid | null, error: PostgrestError };

};

export const fetchGrids = async ({ id }: { id: string }) => {

  const supabase = await createClient();

  const { data: { user }} = await supabase.auth.getUser();

  if (!user) {
    return { data: null, error: { message: "User not found" } };
  };

  const { data, error } = await supabase.rpc('get_grids_with_posts', {
    p_user_id: user.id,
  });

  return { data, error } as { data: Grid[] | null, error: PostgrestError };

};