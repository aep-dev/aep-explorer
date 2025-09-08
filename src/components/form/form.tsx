import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input";
import { useMemo, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import { useAppSelector } from "@/hooks/store";
import { selectHeaders } from "@/state/store";
import { ResourceSchema, PropertySchema } from "@/state/openapi";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Trash2 } from "lucide-react";

type CreateFormProps = {
    resource: ResourceSchema
}

function createZodSchemaForType(type: string, name: string, isRequired: boolean = false): z.ZodTypeAny {
    let schema: z.ZodTypeAny;
    
    switch (type) {
        case 'integer':
            schema = z.coerce.number().int({
                message: `${name} must be an integer`
            });
            break;
        case 'number':
            schema = z.coerce.number({
                message: `${name} must be a number`
            });
            break;
        case 'boolean':
            schema = z.coerce.boolean({
                message: `${name} must be true or false`
            });
            break;
        case 'object':
            schema = z.record(z.any());
            break;
        case 'string':
        default:
            if (isRequired) {
                schema = z.string().min(1, {
                    message: `${name} is required`
                });
            } else {
                schema = z.string().optional();
            }
            return schema; // Return early to avoid making it optional again
    }
    
    // Make numeric, boolean, and object fields optional if not required
    if (!isRequired) {
        schema = schema.optional();
    }
    
    return schema;
}

function createValidationSchema(properties: PropertySchema[], requiredFields: string[]): z.ZodSchema {
    const schemaObject: Record<string, z.ZodTypeAny> = {};
    
    for (const property of properties) {
        if (!property) continue; // Skip null properties
        const isRequired = requiredFields.includes(property.name);
        let fieldSchema: z.ZodTypeAny;
        
        if (property.type === 'array') {
            const itemType = property.items?.type || 'string';
            const itemSchema = createZodSchemaForType(itemType, `${property.name} item`, true);
            
            fieldSchema = z.array(itemSchema);
            if (isRequired) {
                fieldSchema = fieldSchema.min(1, {
                    message: `${property.name} must have at least one item`
                });
            }
        } else {
            fieldSchema = createZodSchemaForType(property.type, property.name, isRequired);
        }
        
        schemaObject[property.name] = fieldSchema;
    }
    
    return z.object(schemaObject);
}

function getInputType(propertyType: string): string {
    switch (propertyType) {
        case 'integer':
        case 'number':
            return 'number';
        case 'boolean':
            return 'checkbox';
        default:
            return 'text';
    }
}

function ArrayFieldComponent({ property, control }: { property: PropertySchema, control: any }) {
    const { fields, append, remove } = useFieldArray({
        control,
        name: property.name,
    });

    const itemType = property.items?.type || 'string';
    const inputType = getInputType(itemType);

    const addItem = () => {
        let defaultValue: any = '';
        if (itemType === 'integer' || itemType === 'number') {
            defaultValue = 0;
        } else if (itemType === 'boolean') {
            defaultValue = false;
        } else if (itemType === 'object') {
            defaultValue = {};
        }
        append(defaultValue);
    };

    return (
        <div className="space-y-2">
            <FormLabel className="text-base font-medium">{property.name}</FormLabel>
            
            {fields.map((field, index) => (
                <FormField
                    key={field.id}
                    control={control}
                    name={`${property.name}.${index}`}
                    render={({ field: inputField }) => (
                        <FormItem>
                            <div className="flex items-center gap-2">
                                <FormControl className="flex-1">
                                    {itemType === 'object' ? (
                                        <Input
                                            {...inputField}
                                            placeholder="JSON object (e.g., {\"key\": \"value\"})"
                                            onChange={(e) => {
                                                try {
                                                    const parsed = JSON.parse(e.target.value);
                                                    inputField.onChange(parsed);
                                                } catch {
                                                    inputField.onChange(e.target.value);
                                                }
                                            }}
                                            value={typeof inputField.value === 'object' 
                                                ? JSON.stringify(inputField.value) 
                                                : inputField.value}
                                        />
                                    ) : (
                                        <Input
                                            {...inputField}
                                            type={inputType}
                                            checked={itemType === 'boolean' ? inputField.value : undefined}
                                            onChange={itemType === 'boolean'
                                                ? (e) => inputField.onChange(e.target.checked)
                                                : inputField.onChange
                                            }
                                        />
                                    )}
                                </FormControl>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="icon"
                                    onClick={() => remove(index)}
                                    className="h-10 w-10 flex-shrink-0"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                            <FormMessage />
                        </FormItem>
                    )}
                />
            ))}
            
            <Button
                type="button"
                variant="outline"
                onClick={addItem}
                className="w-full"
            >
                <Plus className="h-4 w-4 mr-2" />
                Add {property.name.slice(0, -1)} {/* Remove 's' from plural */}
            </Button>
        </div>
    );
}

export default function CreateForm(props: CreateFormProps) {
    const params = useParams();
    const navigate = useNavigate();
    const headers = useAppSelector(selectHeaders);
    
    const validationSchema = useMemo(() => {
        const properties = props.resource.properties();
        const requiredFields = props.resource.required();
        return createValidationSchema(properties, requiredFields);
    }, [props.resource]);
    
    const form = useForm({
        resolver: zodResolver(validationSchema)
    });

    const onSubmit = ((value: Record<string, unknown>) => {
        // Value is the properly formed JSON body.
        // Just need to submit it and navigate back to the list page.
        props.resource.create(value, headers).then(() => {
            toast({description: `Created new resource`});
            navigate(-1);
        }).catch((error: unknown) => {
            // Error handling is already done in the fetch layer (handleResponse)
            // This catch prevents unhandled promise rejections
            console.error('Form submission failed:', error);
        });

    });

    const formBuilder = useMemo(() => {
        return props.resource.properties().map((p) => {
            if (!p) {
                return (<div key="loading">Loading...</div>)
            }
            
            if (p.type === 'array') {
                return (
                    <ArrayFieldComponent
                        key={p.name}
                        property={p}
                        control={form.control}
                    />
                );
            }
            
            return (
                <FormField
                    key={p.name}
                    control={form.control}
                    name={p.name}
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>{p.name}</FormLabel>
                            <FormControl>
                                <Input 
                                    {...field} 
                                    type={getInputType(p.type)}
                                    checked={p.type === 'boolean' ? field.value : undefined}
                                    onChange={p.type === 'boolean' 
                                        ? (e) => field.onChange(e.target.checked)
                                        : field.onChange
                                    }
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
            )
        });
    }, [props, form.control]);

    useEffect(() => {
        // Set parent parameters from URL params, excluding resourceId
        const parentParams = new Map<string, string>();
        for (const [key, value] of Object.entries(params)) {
            if (key !== 'resourceId' && value) {
                parentParams.set(key, value);
            }
        }
        props.resource.parents = parentParams;
    }, [params, props.resource])

    return (
        <Form {...form}>
            <form>
                {formBuilder}
                <Button onClick={form.handleSubmit(onSubmit)} type="submit">Submit</Button>
            </form>
        </Form>
    )
}