import { DataTable } from "@/components/ui/data-table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreHorizontal } from "lucide-react";
import { ResourceSchema } from "@/state/openapi";
import { ResourceInstance } from "@/state/fetch";
import { useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";

type ResourceListTableProps = {
    resource: ResourceSchema;
    resources: ResourceInstance[];
    onRefresh: () => void;
}

type ColumnDef = {
    accessorKey: string;
    header: string;
    accessorFn?: (row: ResourceInstance) => string | number | boolean | null;
    id?: string;
    enableHiding?: boolean;
    cell?: ({ row }: { row: { original: ResourceInstance } }) => JSX.Element;
}

export function ResourceListTable({ resource, resources, onRefresh }: ResourceListTableProps) {
    const navigate = useNavigate();
    
    const dropDownMenuColumn: ColumnDef = {
        id: "actions",
        accessorKey: "actions",
        header: "Actions",
        enableHiding: false,
        cell: ({ row }: { row: { original: ResourceInstance } }) => {
            const resourceForMenu = row.original;

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
                            onClick={() => deleteResource(resourceForMenu)}
                        >
                            <span className="text-red-600">Delete</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            onClick={() => navigate("/" + resourceForMenu['path'])}
                        >
                            <span>Info</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            onClick={() => navigate(`${resourceForMenu['id']}/_update`)}
                        >
                            <span>Update</span>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            )
        },
    };

    function createColumns(r: ResourceSchema | undefined) {
        if(r) {
            const properties = r.properties();
            const columns: ColumnDef[] = properties
                .sort((a, b) => {
                    // First sort by priority (path and id first)
                    const priorityOrder = { path: 0, id: 1 };
                    const aPriority = priorityOrder[a.name as keyof typeof priorityOrder] ?? 2;
                    const bPriority = priorityOrder[b.name as keyof typeof priorityOrder] ?? 2;
                    
                    if (aPriority !== bPriority) {
                        return aPriority - bPriority;
                    }
                    
                    // Then sort alphabetically
                    return a.name.localeCompare(b.name);
                })
                .map((prop) => {
                    return {
                        accessorKey: prop.name,
                        header: prop.name,
                        accessorFn: (row: ResourceInstance) => {
                            const value = (row.properties as Record<string, string | number | boolean | null>)[prop.name];
                            return value ?? '';
                        }
                    }
                });
            columns.push(dropDownMenuColumn);
            return columns;
        } else {
            return [];
        }
    }

    async function deleteResource(r: ResourceInstance) {
        try {
            await r.delete();
            toast({description: `Deleted ${r.path}`});
            onRefresh();
        } catch (error) {
            toast({description: `Failed to delete resource: ${error instanceof Error ? error.message : String(error)}`});
        }
    }

    return (
        <DataTable 
            columns={createColumns(resource)} 
            data={resources} 
        />
    );
} 