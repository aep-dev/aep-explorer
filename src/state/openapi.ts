class Resource {
  schema: any;
  singular_name: string
  plural_name: string
  server_url: string

  constructor(singular_name: string, plural_name: string, schema: any, server_url: string) {
    this.singular_name = singular_name;
    this.plural_name = plural_name;
    this.schema = schema;
    this.server_url = server_url;
  }

  list(): Promise<Array<object>> {
    const url = `${this.server_url}${this.base_url()}`
    return fetch(url).then(response => response.json());
  }

  base_url(): string {
    const pattern = this.schema["x-aep-resource"]["patterns"][0];
    return pattern.substring(0, pattern.lastIndexOf('/'));
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
                    resources.push(new Resource(schema["x-aep-resource"]["singular"], schema["x-aep-resource"]["plural"], schema, this.schema.servers[0].url));
                }
            }
        }
        return resources;
    }

    resourceForName(plural: string): Resource {
        const resources = this.resources();
        for (const resource of resources) {
            if (resource.plural_name === plural) {
                return resource;
            }
        }
        console.log(resources);
        throw new Error(`Resource not found: ${plural}`);

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