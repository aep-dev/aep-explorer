import { ResourceSchema, PropertySchema } from "@/state/openapi";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { z } from "zod";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export function createRouteObjects(resources: ResourceSchema[]): object {
  let base = {
    '/': 'Home',
  }
  if(resources === null) {
    return base;
  }
  return resources.reduce((acc, resource) => {
    acc[resource.base_url()] = capitalize(resource.plural_name);
    acc[`${resource.base_url()}/_create`] = `${resource.singular_name} Create`;
    acc[`${resource.base_url()}/{resourceId}`] = `${resource.singular_name} Info`;
    acc[`${resource.base_url()}/{resourceId}/_update`] = `${resource.singular_name} Update`;
    return acc;
  }, base);
}

// TODO: Consolidate createValidationSchema and createValidationSchemaFromRawSchema into a single function

export function createValidationSchema(properties: PropertySchema[], requiredFields: string[]): z.ZodSchema {
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

export function createValidationSchemaFromRawSchema(schema: any, isRequired: boolean = false): z.ZodTypeAny {
    // This version works directly with raw schema objects (e.g., from CustomMethod.request)
    if (!schema) {
        return z.any().optional();
    }

    const properties = schema.properties || {};
    const required = schema.required || [];
    const schemaObject: Record<string, z.ZodTypeAny> = {};

    for (const [name, propSchema] of Object.entries(properties) as [string, any][]) {
        const isFieldRequired = required.includes(name);
        let fieldSchema: z.ZodTypeAny;

        switch (propSchema.type) {
            case 'object':
                fieldSchema = createValidationSchemaFromRawSchema(propSchema, isFieldRequired);
                break;
            case 'integer':
                fieldSchema = z.coerce.number().int({ message: `${name} must be an integer` });
                break;
            case 'number':
                fieldSchema = z.coerce.number({ message: `${name} must be a number` });
                break;
            case 'boolean':
                fieldSchema = z.coerce.boolean({ message: `${name} must be true or false` });
                break;
            case 'string':
            default:
                if (isFieldRequired) {
                    fieldSchema = z.string().min(1, { message: `${name} is required` });
                } else {
                    fieldSchema = z.string().optional();
                }
                break;
        }

        if (!isFieldRequired) {
            fieldSchema = fieldSchema.optional();
        }

        schemaObject[name] = fieldSchema;
    }

    return z.object(schemaObject);
}