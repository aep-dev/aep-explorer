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
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreHorizontal } from "lucide-react";
import { toast } from "@/hooks/use-toast";

type ResourceRow = {
    id: string
    properties: string
}

const columns: ColumnDef<ResourceRow>[] = [
    {
        accessorKey: "id",
        header: "ID"
    },
    {
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
                  onClick={() => toast({description: `Deleting ${resource}`})}
                >
                    <span className="text-red-600">Delete</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )
        },
      },
]

export default function ResourceList() {
  const { resourceId } = useParams();
  const { spec, setSpec } = useSpec();

  const [results, setResults] = useState([{ id: "Loading..." }]);

  useEffect(() => {
    if (spec && resourceId) {
      spec!
        .resourceForName(resourceId)
        .list()
        .then((resources) => {
          console.log(resources);
          if (resources) {
            setResults(resources.results);
          }
        });
    }
  }, [spec, resourceId]);

  return (
    <div>
      <h1>{resourceId}</h1>

      <DataTable columns={columns} data={results} />
    </div>
  );
}
