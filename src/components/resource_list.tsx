import { DataTable } from "@/components/ui/data-table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, CloudAlert } from "lucide-react";
import { ResourceSchema } from "@/state/openapi";
import { ResourceInstance } from "@/state/fetch";
import { useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { ErrorBoundary } from "@/components/error_boundary";

type ResourceListTableProps = {
  resource: ResourceSchema;
  resources: ResourceInstance[];
  parentParams: Map<string, string>;
  onRefresh: () => void;
};

type ColumnDef = {
  accessorKey: string;
  header: string;
  accessorFn?: (row: ResourceInstance) => string | number | boolean | null;
  id?: string;
  enableHiding?: boolean;
  cell?: ({ row }: { row: { original: ResourceInstance } }) => JSX.Element;
};

export function ResourceListTable({
  resource,
  resources,
  parentParams,
  onRefresh,
}: ResourceListTableProps) {
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
            <DropdownMenuItem onClick={() => deleteResource(resourceForMenu)}>
              <span className="text-red-600">Delete</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => navigate("/" + resourceForMenu["path"])}
            >
              <span>Info</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() =>
                navigate("/" + `${resourceForMenu["path"]}/_update`)
              }
            >
              <span>Update</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  };

  function createColumns(r: ResourceSchema | undefined) {
    if (r) {
      const properties = r.properties();
      const columns: ColumnDef[] = properties
        .sort((a, b) => {
          // First sort by priority (path and id first)
          const priorityOrder = { path: 0, id: 1 };
          const aPriority =
            priorityOrder[a.name as keyof typeof priorityOrder] ?? 2;
          const bPriority =
            priorityOrder[b.name as keyof typeof priorityOrder] ?? 2;

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
              const value = (
                row.properties as Record<
                  string,
                  string | number | boolean | null
                >
              )[prop.name];
              return value ?? "";
            },
          };
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
      toast({ description: `Deleted ${r.path}` });
      onRefresh();
    } catch (error) {
      toast({
        description: `Failed to delete resource: ${error instanceof Error ? error.message : String(error)}`,
      });
    }
  }

  if (resources.length === 0) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <CloudAlert />
          </EmptyMedia>
          <EmptyTitle>No {resource.plural_name}</EmptyTitle>
          <EmptyDescription>
            Get started by creating your first{" "}
            {resource.plural_name.toLowerCase()}.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button
            onClick={() =>
              navigate(
                resource.substituteUrlParameters(
                  resource.base_url(),
                  parentParams,
                ) + "/_create",
              )
            }
          >
            Create {resource.plural_name}
          </Button>
        </EmptyContent>
      </Empty>
    );
  }

  return (
    <ErrorBoundary>
      <DataTable columns={createColumns(resource)} data={resources} />
    </ErrorBoundary>
  );
}
