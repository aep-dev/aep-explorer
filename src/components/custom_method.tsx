import React, { useState, useMemo, useCallback } from "react";
import { CustomMethod } from "@aep_dev/aep-lib-ts";
import { ResourceInstance, mockAwareFetch } from "@/state/fetch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldError,
} from "@/components/ui/field";
import { Form as FormProvider, FormField } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "@/hooks/use-toast";
import { createValidationSchemaFromRawSchema } from "@/lib/utils";

type CustomMethodProps = {
  resourceInstance: ResourceInstance;
  customMethod: CustomMethod;
};

export function CustomMethodComponent(props: CustomMethodProps) {
  const [response, setResponse] = useState<Record<string, unknown> | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(false);

  const validationSchema = useMemo(() => {
    return createValidationSchemaFromRawSchema(
      (props.customMethod.request as unknown as Record<string, unknown>) || {},
    );
  }, [props.customMethod]);

  const form = useForm<Record<string, unknown>>({
    resolver: zodResolver(validationSchema),
    defaultValues: {},
  });

  const onSubmit = async (data: Record<string, unknown>) => {
    setIsLoading(true);
    setResponse(null);

    try {
      // Construct the URL for the custom method
      const url = `${props.resourceInstance.schema.server_url}/${props.resourceInstance.path}:${props.customMethod.name}`;

      const response = await mockAwareFetch(url, {
        method: props.customMethod.method,
        headers: {
          "Content-Type": "application/json",
        },
        body: Object.keys(data).length > 0 ? JSON.stringify(data) : undefined,
      });

      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
      }

      const responseData = await response.json();
      setResponse(responseData);
      toast({
        description: `${props.customMethod.name} completed successfully`,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      toast({
        description: `Failed to execute ${props.customMethod.name}: ${message}`,
      });
      setResponse({ error: message });
    } finally {
      setIsLoading(false);
    }
  };

  const getInputType = (propertyType: string): React.HTMLInputTypeAttribute => {
    switch (propertyType) {
      case "integer":
      case "number":
        return "number";
      case "boolean":
        return "checkbox";
      default:
        return "text";
    }
  };

  const renderField = useCallback(
    (
      name: string,
      propSchema: Record<string, unknown>,
      parentPath: string = "",
    ): React.ReactNode => {
      const fieldPath = parentPath ? `${parentPath}.${name}` : name;

      if (propSchema.type === "object") {
        const nestedProperties = propSchema.properties || {};
        return (
          <div
            key={fieldPath}
            className="space-y-2 pl-4 border-l-2 border-gray-200"
          >
            <label className="font-medium">{name}</label>
            {Object.entries(nestedProperties).map(
              ([nestedName, nestedSchema]) =>
                renderField(
                  nestedName,
                  nestedSchema as Record<string, unknown>,
                  fieldPath,
                ),
            )}
          </div>
        );
      }

      return (
        <FormField
          key={fieldPath}
          control={form.control}
          name={fieldPath}
          render={({ field, fieldState }) => {
            const inputId = `input-${fieldPath}`;
            const { value, onChange, ...fieldProps } = field;
            return (
              <Field data-invalid={!!fieldState.error}>
                <FieldLabel htmlFor={inputId}>{name}</FieldLabel>
                <Input
                  {...fieldProps}
                  id={inputId}
                  type={
                    getInputType(
                      propSchema.type as string,
                    ) as React.HTMLInputTypeAttribute
                  }
                  value={
                    propSchema.type === "boolean"
                      ? undefined
                      : (value as string | number | undefined)
                  }
                  checked={
                    propSchema.type === "boolean"
                      ? (value as boolean)
                      : undefined
                  }
                  onChange={
                    propSchema.type === "boolean"
                      ? (e) => onChange(e.target.checked)
                      : onChange
                  }
                  aria-invalid={!!fieldState.error}
                />
                {fieldState.error && (
                  <FieldError>{fieldState.error.message}</FieldError>
                )}
              </Field>
            );
          }}
        />
      );
    },
    [form.control],
  );

  const formFields = useMemo(() => {
    if (!props.customMethod.request || !props.customMethod.request.properties) {
      return null;
    }

    const properties = props.customMethod.request.properties;
    return Object.entries(properties).map(([name, schema]) =>
      renderField(name, schema as Record<string, unknown>),
    );
  }, [props.customMethod, renderField]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{props.customMethod.name}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <FormProvider {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {formFields && <FieldGroup>{formFields}</FieldGroup>}
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Submitting..." : "Submit"}
            </Button>
          </form>
        </FormProvider>

        {response && (
          <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-md">
            <h4 className="font-medium mb-2">Response:</h4>
            <pre className="text-sm overflow-auto">
              {JSON.stringify(response, null, 2)}
            </pre>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
