import { fetchGrid } from "@/utils/grids/fetch";
import { GridContents } from "@/app/grid/[grid_id]/contents";
import { GridProvider } from "@/context/gridContext";

type PageProps = {
    params: Promise<{
        grid_id: string;
    }>;
};

const Index = async ({ params: unresolvedParams }: PageProps) => {

    const gridId = (await unresolvedParams).grid_id;

    if (!gridId) {
        return <div className="font-xanh">Grid not found</div>;
    };

    const { data, error } = await fetchGrid({ id: gridId });

    if (error) {
        console.error(error);
        return <div className="font-xanh">Error fetching grid</div>;
    };

    if (!data) {
        return <div className="font-xanh">Grid not found</div>;
    };

    return (
        <GridProvider grid={data}>
            <GridContents />
        </GridProvider>
    );

};

export default Index;