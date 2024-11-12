import { OpenAPISchema, SchemaSchema } from "./openapi_types";

class Resource {
  schema: typeof SchemaSchema;
  name: string

  constructor(name: string, schema: typeof SchemaSchema) {
    this.name = name;
    this.schema = schema;
  }
}

class OpenAPI {
    schema: any

    constructor(schema: any) {
        this.schema = schema;
    }

    resources(): Resource[] {
        const resources: Resource[] = [];
        
        if (this.schema?.components?.schemas) {
            for (const [name, schema] of Object.entries(this.schema.components.schemas)) {
                if (schema.XAEPResource) {
                    resources.push(new Resource(name, schema as typeof SchemaSchema));
                }
            }
        }
        return resources;
    }
}


function parseOpenAPI(jsonString: string): OpenAPI {
  try {
    const parsed = JSON.parse(jsonString);
    const result = OpenAPISchema.parse(parsed);
    return new OpenAPI(result);
  } catch (error) {
    throw new Error(`Failed to parse OpenAPI schema: ${error instanceof Error ? error.message : String(error)}`);
  }
}

export {OpenAPI, parseOpenAPI};