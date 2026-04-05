import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { ResourceInstance } from "@/state/fetch";
import { ResourceSchema } from "@/state/openapi";
import { CustomMethodComponent } from "@/components/custom_method";
import ResourceListPage from "@/app/explorer/resource_list";

type ResourceProperties = {
  path: string;
  [key: string]: string | number | boolean;
};

type ResourceInfoProps = {
  resource: ResourceSchema;
  resourceInstance: ResourceInstance | null;
  childResources: ResourceSchema[];
};

// ResourceInfo renders the details of a resource instance, its custom methods,
// and listings of its child resources. It is a presentational component and
// does not fetch data or depend on routing state.
export function ResourceInfo(props: ResourceInfoProps) {
  const { resource, resourceInstance, childResources } = props;

  const properties = useMemo(() => {
    if (resourceInstance?.properties) {
      const results = [];
      for (const [key, value] of Object.entries(
        resourceInstance.properties as ResourceProperties,
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
  }, [resourceInstance]);

  const customMethods = useMemo(() => {
    return resource.customMethods();
  }, [resource]);

  return (
    <div className="space-y-6">
      {/* Resource Instance card. */}
      <Card>
        <CardHeader>
          <CardTitle>
            {(resourceInstance?.properties as ResourceProperties)?.path}
          </CardTitle>
        </CardHeader>
        <CardContent>{properties}</CardContent>
      </Card>

      {/* Custom Methods */}
      {resourceInstance && customMethods.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Custom Methods</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {customMethods.map((customMethod) => (
              <CustomMethodComponent
                key={customMethod.name}
                resourceInstance={resourceInstance}
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
