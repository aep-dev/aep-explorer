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
import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { DataTable } from "@/components/ui/data-table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreHorizontal } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { ResourceSchema } from "@/state/openapi";
import { ResourceInstance } from "@/state/fetch";

type ResourceListState = {
    resources: ResourceInstance[],
}

type ResourceListProps = {
    resource: ResourceSchema
}

export default function ResourceList(props: ResourceListProps) {
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
                            onClick={() => deleteResource(resource)}
                        >
                            <span className="text-red-600">Delete</span>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            )
        },
    };

    function createColumns(r: ResourceSchema | undefined): object[] {
        if(r) {
            let columns = r.properties().map((prop) => {
                return {accessorKey: prop.name, header: prop.name}
            });
            columns.push(dropDownMenuColumn);
            return columns;
        } else {
            return [];
        }
    }



    const [state, setState] = useState<ResourceListState>(
        {
            resources: [],
        });

    function deleteResource(r: object) {
        const result = state?.resources.find((result: ResourceInstance) => result.id === r.id);
        if(result) {
            result.delete().then(() => {
                toast({description: `Deleted ${result.path}`});
                refreshList();
            })
        }
    }
    const refreshList = useCallback(() => {
                props.resource
                .list()
                .then((resources) => {
                    if (resources) {
                        setState({
                            resources: resources,
                        });
                    }
                });
    }, [props]);  // Add dependencies

    useEffect(() => {
        refreshList();
    }, [props, refreshList]);

    return (
        <div>
            <h1>{props.resource.singular_name}</h1>
            <Link to={"_create"}>
                <span>Create</span>
            </Link>
            <DataTable columns={createColumns(props.resource)} data={state.resources.map((resource) => resource.properties)} />
        </div>
    );
}
