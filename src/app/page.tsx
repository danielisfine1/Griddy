import { Home } from "@/app/contents";

import { createClient } from "@/utils/supabase/server";
import { Dashboard } from "@/components/Dashboard";

import { fetchGrids } from "@/utils/grids/fetch";

export default async function Index() {

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {

    const { data: grids } = await fetchGrids({ id: user.id });
  
    return (
      <Dashboard grids={grids ?? []} />
    );

  } else {

    return (
      <Home />
    );

  };

};
