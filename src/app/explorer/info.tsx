import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { ResourceInstance } from "@/state/fetch";
import { ResourceSchema } from "@/state/openapi";
import { useAppSelector } from "@/hooks/store";
import { selectChildResources, selectHeaders } from "@/state/store";
import { ResourceInfo } from "@/components/info/info";

type ResourceProperties = {
  path: string;
  [key: string]: string | number | boolean;
};

type InfoPageProps = {
  resource: ResourceSchema;
};

export default function InfoPage(props: InfoPageProps) {
  const params = useParams();
  const [state, setState] = useState<ResourceInstance | null>(null);

  const childResources = useAppSelector((globalState) =>
    state
      ? selectChildResources(
          globalState,
          props.resource,
          (state.properties as ResourceProperties)?.path?.split("/").pop() ||
            "",
        )
      : [],
  );

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

  useEffect(() => {
    // Set parent parameters on the resource for other uses
    props.resource.parents = parentParams;

    // Fetch the resource instance
    props.resource
      .get(params["resourceId"] as string, parentParams, headers)
      .then((instance) => setState(instance));
  }, [params, props.resource, parentParams, headers]);

  return (
    <ResourceInfo
      resource={props.resource}
      resourceInstance={state}
      childResources={childResources}
    />
  );
}
