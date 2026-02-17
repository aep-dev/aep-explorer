import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { ResourceInstance } from "@/state/fetch";
import { ResourceSchema } from "@/state/openapi";
import { useAppSelector } from "@/hooks/store";
import { selectChildResources } from "@/state/store";
import ResourceListPage from "./resource_list";
import { CustomMethodComponent } from "@/components/custom_method";

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

  useEffect(() => {
    // Set parent parameters from URL params, excluding resourceId
    const parentParams = new Map<string, string>();
    for (const [key, value] of Object.entries(params)) {
      if (key !== "resourceId" && value) {
        parentParams.set(key, value);
      }
    }
    props.resource.parents = parentParams;

    // Fetch the resource instance
    props.resource
      .get(params["resourceId"]!)
      .then((instance) => setState(instance));
  }, [params, props.resource]);

  const properties = useMemo(() => {
    if (state?.properties) {
      const results = [];
      for (const [key, value] of Object.entries(
        state.properties as ResourceProperties,
      )) {
        results.push(
          <p key={key}>
            <b>{key}:</b> {value}
          </p>,
        );
      }
      return results;
    }
    return <Spinner />;
  }, [state]);

  const customMethods = useMemo(() => {
    return props.resource.customMethods();
  }, [props.resource]);

  return (
    <div className="space-y-6">
      {/* Resource Instance card. */}
      <Card>
        <CardHeader>
          <CardTitle>
            {(state?.properties as ResourceProperties)?.path}
          </CardTitle>
        </CardHeader>
        <CardContent>{properties}</CardContent>
      </Card>

      {/* Custom Methods */}
      {state && customMethods.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Custom Methods</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {customMethods.map((customMethod) => (
              <CustomMethodComponent
                key={customMethod.name}
                resourceInstance={state}
                customMethod={customMethod}
              />
            ))}
          </CardContent>
        </Card>
      )}

      {/* Listing Child Resources */}
      {childResources.map((childResource) => (
        <Card key={childResource.singular_name}>
          <CardHeader>
            <CardTitle>{childResource.plural_name}</CardTitle>
          </CardHeader>
          <CardContent>
            <ResourceListPage resource={childResource} />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
