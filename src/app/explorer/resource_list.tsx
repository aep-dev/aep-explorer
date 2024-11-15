import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { ColumnDef } from "@tanstack/react-table"
import { useSpec } from "@/state/StateContext";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { DataTable } from "@/components/ui/data-table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreHorizontal } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { ResourceSchema } from "@/state/openapi";

const dropDownMenuColumn = {
    id: "actions",
    enableHiding: false,
    cell: ({ row }) => {
        const resource = row.original

        return (
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Open menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuItem
                        onClick={() => toast({ description: `Deleting ${resource}` })}
                    >
                        <span className="text-red-600">Delete</span>
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        )
    },
};



function createColumns(r: ResourceSchema): object[] {
    if(r) {
        return r.properties().map((prop) => {
            return {accessorKey: prop.name, header: prop.name}
        });
    } else {
        return [];
    }
}

type ResourceListState = {
    results: object[],
    columns: object[]
}

export default function ResourceList() {
    const { resourceId } = useParams();
    const { spec, setSpec } = useSpec();

    const [state, setState] = useState<ResourceListState>(
        {
            results: [{id: "Loading..."}],
            columns: [{accessorKey: "id", header: "id"}],
        });

    useEffect(() => {
        if (spec && resourceId) {
            spec!
                .resourceForName(resourceId)
                .list()
                .then((resources) => {
                    if (resources) {
                        let resource_data = resources.map((resource) => resource.properties);
                        console.log(resource_data);
                        let column_list: object[] = createColumns(spec!.resourceForName(resourceId));
                        column_list.push(dropDownMenuColumn);
                        console.log(column_list);
                        setState({
                            results: resource_data,
                            columns: column_list,
                        });
                    }
                });
        }
    }, [spec, resourceId]);

    return (
        <div>
            <h1>{resourceId}</h1>

            <DataTable columns={state.columns} data={state.results} />
        </div>
    );
}
