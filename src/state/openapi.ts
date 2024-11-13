class Resource {
  schema: any;
  singular_name: string
  plural_name: string

  constructor(singular_name: string, plural_name: string, schema: any) {
    this.singular_name = singular_name;
    this.plural_name = plural_name;
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
                if (Object.prototype.hasOwnProperty.call(schema, "x-aep-resource")) {
                    resources.push(new Resource(schema["x-aep-resource"]["singular"], schema["x-aep-resource"]["plural"], schema));
                }
            }
        }
        return resources;
    }
}


function parseOpenAPI(jsonString: string): OpenAPI {
  try {
    const parsed = JSON.parse(jsonString);
    return new OpenAPI(parsed);
  } catch (error) {
    throw new Error(`Failed to parse OpenAPI schema: ${error instanceof Error ? error.message : String(error)}`);
  }
}

export {OpenAPI, parseOpenAPI};