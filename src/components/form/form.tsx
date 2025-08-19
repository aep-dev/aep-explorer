import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input";
import { useMemo, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import { useAppSelector } from "@/hooks/store";
import { selectHeaders } from "@/state/store";
import { ResourceSchema, PropertySchema } from "@/state/openapi";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

type CreateFormProps = {
    resource: ResourceSchema
}

function createValidationSchema(properties: PropertySchema[], requiredFields: string[]): z.ZodSchema {
    const schemaObject: Record<string, z.ZodTypeAny> = {};
    
    for (const property of properties) {
        if (!property) continue; // Skip null properties
        let fieldSchema: z.ZodTypeAny;
        const isRequired = requiredFields.includes(property.name);
        
        switch (property.type) {
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
        if (!isRequired && (property.type === 'integer' || property.type === 'number' || property.type === 'boolean')) {
            fieldSchema = fieldSchema.optional();
        }
        
        schemaObject[property.name] = fieldSchema;
    }
    
    return z.object(schemaObject);
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