import { Form as FormProvider, FormControl, FormField } from "@/components/ui/form";
import { Field, FieldGroup, FieldLabel, FieldError, FieldSet, FieldLegend } from "@/components/ui/field";
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { ButtonGroup } from "@/components/ui/button-group";
import React, { useMemo, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import { useAppSelector } from "@/hooks/store";
import { selectHeaders } from "@/state/store";
import { ResourceSchema, PropertySchema } from "@/state/openapi";
import { ResourceInstance } from "@/state/fetch";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { JsonEditor } from 'json-edit-react';

type FormProps = {
    resource: ResourceSchema;
    parentParams: Map<string, string>;
    headers: string;
    onSuccess: () => void;
    onError: (error: unknown) => void;
    // Current resource state used to fill in the form's default values for updating (optional)
    resourceInstance?: ResourceInstance;
    onSubmitOperation: (value: Record<string, unknown>) => Promise<void>;
}

function createValidationSchema(properties: PropertySchema[], requiredFields: string[]): z.ZodSchema {
    // Validation happens through Zod. 
    // This function converts an OpenAPI schema to a Zod schema.
    const schemaObject: Record<string, z.ZodTypeAny> = {};

    for (const property of properties) {
        if (!property) continue; // Skip null properties
        let fieldSchema: z.ZodTypeAny;
        const isRequired = requiredFields.includes(property.name);

        switch (property.type) {
            case 'object':
                const nestedProperties = property.properties();
                const nestedRequired = property.required();
                fieldSchema = createValidationSchema(nestedProperties, nestedRequired);
                break;
            case 'integer':
                fieldSchema = z.coerce.number().int({
                    message: `${property.name} must be an integer`
                });
                break;
            case 'number':
                fieldSchema = z.coerce.number({
                    message: `${property.name} must be a number`
                });
                break;
            case 'boolean':
                fieldSchema = z.coerce.boolean({
                    message: `${property.name} must be true or false`
                });
                break;
            case 'string':
            default:
                if (isRequired) {
                    fieldSchema = z.string().min(1, {
                        message: `${property.name} is required`
                    });
                } else {
                    fieldSchema = z.string().optional();
                }
                break;
        }

        // Make numeric and boolean fields optional if not required
        if (!isRequired) {
            fieldSchema = fieldSchema.optional();
        }

        schemaObject[property.name] = fieldSchema;
    }

    return z.object(schemaObject);
}

// Form is responsible for rendering a form based on the resource schema.
export function Form(props: FormProps) {
    const [mode, setMode] = useState<'form' | 'json'>('form');
    const [jsonData, setJsonData] = useState<Record<string, unknown>>({});
    const [jsonError, setJsonError] = useState<string | null>(null);

    const validationSchema = useMemo(() => {
        const properties = props.resource.properties();
        const requiredFields = props.resource.required();
        return createValidationSchema(properties, requiredFields);
    }, [props.resource]);

    const defaultValues = useMemo(() => {
        return props.resourceInstance?.properties || {};
    }, [props.resourceInstance]);

    const form = useForm({
        resolver: zodResolver(validationSchema),
        defaultValues: defaultValues
    });

    // Initialize JSON data from form values
    useEffect(() => {
        setJsonData(form.getValues());
    }, [props.resourceInstance]);

    // Sync form to JSON when switching to JSON mode
    const handleModeChange = (newMode: 'form' | 'json') => {
        if (newMode === 'json') {
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
                    setJsonError(error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', '));
                    return; // Don't switch modes if validation fails
                }
            }
        }
        setMode(newMode);
    };

    const onSubmit = ((value: Record<string, unknown>) => {
        // Value is the properly formed JSON body.
        // Just need to submit it and call the appropriate callback.
        props.onSubmitOperation(value).then(() => {
            props.onSuccess();
        }).catch((error: unknown) => {
            props.onError(error);
        });
    });

    const handleFormSubmit = () => {
        if (mode === 'json') {
            // Validate JSON data before submitting
            try {
                const validated = validationSchema.parse(jsonData);
                onSubmit(validated);
            } catch (error) {
                if (error instanceof z.ZodError) {
                    setJsonError(error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', '));
                }
            }
        } else {
            form.handleSubmit(onSubmit)();
        }
    };

    const getInputType = (propertyType: string) => {
        switch (propertyType) {
            case 'integer':
            case 'number':
                return 'number';
            case 'boolean':
                return 'checkbox';
            default:
                return 'text';
        }
    };

    const renderField = (p: PropertySchema, parentPath: string = ''): React.ReactNode => {
        if (!p) {
            return (<Spinner key="loading" />);
        }

        const fieldPath = parentPath ? `${parentPath}.${p.name}` : p.name;

        if (p.type === 'object') {
            const nestedProperties = p.properties();
            return (
                <FieldSet key={fieldPath}>
                    <FieldLegend>{p.name}</FieldLegend>
                    <FieldGroup>
                        {nestedProperties.map((nestedProp) => renderField(nestedProp, fieldPath))}
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
                    return (
                        <Field data-invalid={!!fieldState.error}>
                            <FieldLabel htmlFor={inputId}>{p.name}</FieldLabel>
                            <Input
                                {...field}
                                id={inputId}
                                type={getInputType(p.type)}
                                checked={p.type === 'boolean' ? field.value : undefined}
                                onChange={p.type === 'boolean'
                                    ? (e) => field.onChange(e.target.checked)
                                    : field.onChange
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
    };

    const formBuilder = useMemo(() => {
        return props.resource.properties().map((p) => renderField(p));
    }, [props.resource, form.control]);

    useEffect(() => {
        // Set parent parameters on the resource
        props.resource.parents = props.parentParams;
    }, [props.parentParams, props.resource])

    return (
        <FormProvider {...form}>
            <div className="space-y-4">
                <ButtonGroup>
                    <Button
                        type="button"
                        variant={mode === 'form' ? 'default' : 'outline'}
                        onClick={() => handleModeChange('form')}
                    >
                        Form
                    </Button>
                    <Button
                        type="button"
                        variant={mode === 'json' ? 'default' : 'outline'}
                        onClick={() => handleModeChange('json')}
                    >
                        JSON
                    </Button>
                </ButtonGroup>

                {mode === 'form' ? (
                    <form>
                        <FieldGroup>
                            {formBuilder}
                        </FieldGroup>
                    </form>
                ) : (
                    <div className="space-y-2">
                        <JsonEditor
                            data={jsonData}
                            setData={setJsonData}
                        />
                        {jsonError && (
                            <div className="text-sm text-red-600 dark:text-red-400" role="alert">
                                {jsonError}
                            </div>
                        )}
                    </div>
                )}

                <Button onClick={handleFormSubmit} type="submit">Submit</Button>
            </div>
        </FormProvider>
    )
}

// CreateForm wrapper component that uses hooks to provide props to Form
export default function CreateForm(props: { resource: ResourceSchema }) {
    const params = useParams();
    const navigate = useNavigate();
    const headers = useAppSelector(selectHeaders);

    const parentParams = useMemo(() => {
        const parentMap = new Map<string, string>();
        for (const [key, value] of Object.entries(params)) {
            if (key !== 'resourceId' && value) {
                parentMap.set(key, value);
            }
        }
        return parentMap;
    }, [params]);

    const handleSuccess = () => {
        toast({ description: 'Created new resource' });
        navigate(-1);
    };

    const handleError = (error: unknown) => {
        // Error handling is already done in the fetch layer (handleResponse)
        // This catch prevents unhandled promise rejections
        console.error('Form submission failed:', error);
    };

    return (
        <Form
            resource={props.resource}
            parentParams={parentParams}
            headers={headers}
            onSuccess={handleSuccess}
            onError={handleError}
            onSubmitOperation={(value) => props.resource.create(value, headers)}
        />
    );
}