import { Form as FormProvider, FormField } from "@/components/ui/form";
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldError,
  FieldSet,
  FieldLegend,
} from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { ButtonGroup } from "@/components/ui/button-group";
import React, { useMemo, useEffect, useState, useCallback } from "react";
import { useForm } from "react-hook-form";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import { useAppSelector } from "@/hooks/store";
import { selectHeaders } from "@/state/store";
import { ResourceSchema, PropertySchema } from "@/state/openapi";
import { ResourceInstance } from "@/state/fetch";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { JsonEditor } from "json-edit-react";
import { createValidationSchema } from "@/lib/utils";

export type AdditionalField = {
  name: string;
  type: string;
  required?: boolean;
};

type FormProps = {
  resource: ResourceSchema;
  parentParams: Map<string, string>;
  headers: string;
  onSuccess: () => void;
  onError: (error: unknown) => void;
  resourceInstance?: ResourceInstance;
  onSubmitOperation: (
    value: Record<string, unknown>,
    additionalFieldsValues: Record<string, unknown>,
  ) => Promise<unknown>;
  additionalFields?: AdditionalField[];
};

// Form is responsible for rendering a form based on the resource schema.
export function Form(props: FormProps) {
  const [mode, setMode] = useState<"form" | "json">("form");
  const [jsonData, setJsonData] = useState<Record<string, unknown>>({});
  const [jsonError, setJsonError] = useState<string | null>(null);

  const validationSchema = useMemo(() => {
    const properties = props.resource.properties();
    const requiredFields = props.resource.required();
    const baseSchema = createValidationSchema(properties, requiredFields);

    if (!props.additionalFields?.length) return baseSchema;

    const additionalSchemaObj: Record<string, z.ZodTypeAny> = {};
    for (const field of props.additionalFields) {
      const fieldSchema =
        field.type === "string"
          ? field.required
            ? z.string().min(1, { message: `${field.name} is required` })
            : z.string().optional()
          : z.string().optional();
      additionalSchemaObj[field.name] = fieldSchema;
    }

    return (baseSchema as z.ZodObject<Record<string, z.ZodTypeAny>>).extend(
      additionalSchemaObj,
    );
  }, [props.resource, props.additionalFields]);

  const defaultValues = useMemo(() => {
    return props.resourceInstance?.properties || {};
  }, [props.resourceInstance]);

  const form = useForm<Record<string, unknown>>({
    resolver: zodResolver(validationSchema),
    defaultValues: defaultValues,
  });

  // Initialize JSON data from form values
  useEffect(() => {
    setJsonData(form.getValues());
  }, [props.resourceInstance, form]);

  // Sync form to JSON when switching to JSON mode
  const handleModeChange = (newMode: "form" | "json") => {
    if (newMode === "json") {
      // Switching to JSON mode - sync form data to JSON
      setJsonData(form.getValues());
      setJsonError(null);
    } else {
      // Switching to form mode - sync JSON data to form
      try {
        // Validate JSON against schema
        validationSchema.parse(jsonData);
        // Update form with JSON data
        Object.keys(jsonData).forEach((key) => {
          form.setValue(key, jsonData[key]);
        });
        setJsonError(null);
      } catch (error) {
        if (error instanceof z.ZodError) {
          setJsonError(
            error.errors
              .map((e) => `${e.path.join(".")}: ${e.message}`)
              .join(", "),
          );
          return; // Don't switch modes if validation fails
        }
      }
    }
    setMode(newMode);
  };

  const onSubmit = (value: Record<string, unknown>) => {
    const additionalFieldValues: Record<string, unknown> = {};
    if (props.additionalFields) {
      for (const field of props.additionalFields) {
        additionalFieldValues[field.name] = value[field.name];
        delete value[field.name];
      }
    }
    // Value is the properly formed JSON body.
    // Just need to submit it and call the appropriate callback.
    props
      .onSubmitOperation(value, additionalFieldValues)
      .then(() => {
        props.onSuccess();
      })
      .catch((error: unknown) => {
        props.onError(error);
      });
  };

  const handleFormSubmit = () => {
    if (mode === "json") {
      // Validate JSON data before submitting
      try {
        const validated = validationSchema.parse(jsonData);
        onSubmit(validated);
      } catch (error) {
        if (error instanceof z.ZodError) {
          setJsonError(
            error.errors
              .map((e) => `${e.path.join(".")}: ${e.message}`)
              .join(", "),
          );
        }
      }
    } else {
      form.handleSubmit(onSubmit)();
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
    (p: PropertySchema, parentPath: string = ""): React.ReactNode => {
      if (!p) {
        return <Spinner key="loading" />;
      }

      if (p.readOnly) {
        return null;
      }

      const fieldPath = parentPath ? `${parentPath}.${p.name}` : p.name;

      if (p.type === "object") {
        const nestedProperties = p.properties();
        return (
          <FieldSet key={fieldPath}>
            <FieldLegend>{p.name}</FieldLegend>
            <FieldGroup>
              {nestedProperties.map((nestedProp) =>
                renderField(nestedProp, fieldPath),
              )}
            </FieldGroup>
          </FieldSet>
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
                <FieldLabel htmlFor={inputId}>{p.name}</FieldLabel>
                <Input
                  {...fieldProps}
                  id={inputId}
                  type={getInputType(p.type) as React.HTMLInputTypeAttribute}
                  value={
                    p.type === "boolean"
                      ? undefined
                      : (value as string | number | undefined)
                  }
                  checked={
                    p.type === "boolean" ? (value as boolean) : undefined
                  }
                  onChange={
                    p.type === "boolean"
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

  const additionalFieldElements = useMemo(() => {
    if (!props.additionalFields?.length) return null;
    return props.additionalFields.map((af) => {
      const p = new PropertySchema(af.name, af.type);
      return renderField(p);
    });
  }, [props.additionalFields, renderField]);

  const formBuilder = useMemo(() => {
    return props.resource.properties().map((p) => renderField(p));
  }, [props.resource, renderField]);

  useEffect(() => {
    // Set parent parameters on the resource
    props.resource.parents = props.parentParams;
  }, [props.parentParams, props.resource]);

  return (
    <FormProvider {...form}>
      <div className="space-y-4">
        <ButtonGroup>
          <Button
            type="button"
            variant={mode === "form" ? "default" : "outline"}
            onClick={() => handleModeChange("form")}
          >
            Form
          </Button>
          <Button
            type="button"
            variant={mode === "json" ? "default" : "outline"}
            onClick={() => handleModeChange("json")}
          >
            JSON
          </Button>
        </ButtonGroup>

        {mode === "form" ? (
          <form>
            <FieldGroup>
              {additionalFieldElements}
              {formBuilder}
            </FieldGroup>
          </form>
        ) : (
          <div className="space-y-2">
            <JsonEditor
              data={jsonData}
              setData={(d: unknown) =>
                setJsonData(d as Record<string, unknown>)
              }
            />
            {jsonError && (
              <div
                className="text-sm text-red-600 dark:text-red-400"
                role="alert"
              >
                {jsonError}
              </div>
            )}
          </div>
        )}

        <Button onClick={handleFormSubmit} type="submit">
          Submit
        </Button>
      </div>
    </FormProvider>
  );
}

// CreateForm wrapper component that uses hooks to provide props to Form
export default function CreateForm(props: { resource: ResourceSchema }) {
  const params = useParams();
  const navigate = useNavigate();
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

  const handleSuccess = () => {
    toast({ description: "Created new resource" });
    navigate(-1);
  };

  const handleError = (error: unknown) => {
    // Error handling is already done in the fetch layer (handleResponse)
    // This catch prevents unhandled promise rejections
    console.error("Form submission failed:", error);
  };

  return (
    <Form
      resource={props.resource}
      parentParams={parentParams}
      headers={headers}
      onSuccess={handleSuccess}
      onError={handleError}
      onSubmitOperation={(value, additionalFieldsValues) => {
        let id: string | undefined = undefined;
        if (additionalFieldsValues.id) {
          id = additionalFieldsValues.id as string;
        }
        return props.resource.create(value, id, parentParams, headers);
      }}
      additionalFields={
        props.resource.supportsUserSettableCreate
          ? [{ name: "id", type: "string" }]
          : undefined
      }
    />
  );
}
