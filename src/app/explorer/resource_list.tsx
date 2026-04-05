import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ResourceSchema } from "@/state/openapi";
import { ResourceInstance } from "@/state/fetch";
import { selectHeaders } from "@/state/store";
import { useAppSelector } from "@/hooks/store";
import { ListResourceComponent } from "@/components/list/list";

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

  const handleCreate = useCallback(() => {
    navigate(
      props.resource.substituteUrlParameters(
        props.resource.base_url(),
        parentParams,
      ) + "/_create",
    );
  }, [navigate, props.resource, parentParams]);

  return (
    <ListResourceComponent
      resource={props.resource}
      resources={state.resources}
      parentParams={parentParams}
      onRefresh={refreshList}
      onCreate={handleCreate}
    />
  );
}
