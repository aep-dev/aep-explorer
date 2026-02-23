import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Plus, RefreshCw } from "lucide-react";
import { ResourceSchema } from "@/state/openapi";
import { ResourceInstance } from "@/state/fetch";
import { selectHeaders } from "@/state/store";
import { useAppSelector } from "@/hooks/store";
import { ResourceListTable } from "@/components/resource_list";

type ResourceListState = {
  resources: ResourceInstance[];
};

type ResourceListProps = {
  resource: ResourceSchema;
};

export default function ResourceListPage(props: ResourceListProps) {
  const navigate = useNavigate();
  const params = useParams();
  const [state, setState] = useState<ResourceListState>({
    resources: [],
  });

  const headers = useAppSelector(selectHeaders);

  const parentParams = useMemo(() => {
    const parentMap = new Map<string, string>();
    for (const [key, value] of Object.entries(params)) {
      if (key !== "resourceId" && value) {
        parentMap.set(key, value);
      }
    }
    return parentMap;
  }, [params]);

  const refreshList = useCallback(() => {
    props.resource.list(parentParams, headers).then((resources) => {
      if (resources) {
        setState({
          resources: resources,
        });
      }
    });
  }, [props, headers, parentParams]);

  useEffect(() => {
    refreshList();
  }, [props, refreshList]);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1>
          {props.resource.plural_name
            .split(" ")
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(" ")}
        </h1>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() =>
              navigate(
                props.resource.substituteUrlParameters(
                  props.resource.base_url(),
                  parentParams,
                ) + "/_create",
              )
            }
          >
            <Plus className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={refreshList}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <ResourceListTable
        resource={props.resource}
        resources={state.resources}
        parentParams={parentParams}
        onRefresh={refreshList}
      />
    </div>
  );
}
