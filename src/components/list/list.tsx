import { Button } from "@/components/ui/button";
import { Plus, RefreshCw } from "lucide-react";
import { ResourceSchema } from "@/state/openapi";
import { ResourceInstance } from "@/state/fetch";
import { ResourceListTable } from "@/components/resource_list";

type ListResourceComponentProps = {
  resource: ResourceSchema;
  resources: ResourceInstance[];
  parentParams: Map<string, string>;
  onRefresh: () => void;
  onCreate: () => void;
};

// ListResourceComponent renders the header (title, create, refresh) and
// table for a list of resource instances. It is a presentational component
// and does not fetch data or depend on routing state.
export function ListResourceComponent(props: ListResourceComponentProps) {
  const { resource, resources, parentParams, onRefresh, onCreate } = props;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1>
          {resource.plural_name
            .split(" ")
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(" ")}
        </h1>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={onCreate}>
            <Plus className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={onRefresh}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <ResourceListTable
        resource={resource}
        resources={resources}
        parentParams={parentParams}
        onRefresh={onRefresh}
      />
    </div>
  );
}
