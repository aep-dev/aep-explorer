import { List, ResourceInstance, Create, Get } from './fetch';
// Responsible for handling the schema for a given resource.
class ResourceSchema {
  schema: any;
  singular_name: string;
  plural_name: string;
  server_url: string;
  parents: Map<string, string>;

  constructor(
    singular_name: string,
    plural_name: string,
    schema: any,
    server_url: string,
  ) {
    this.singular_name = singular_name;
    this.plural_name = plural_name;
    this.schema = schema;
    this.server_url = server_url;
    this.parents = new Map();
  }

  public substituteUrlParameters(url: string): string {
    const paramRegex = /\{([^}]+)\}/g;
    let match;
    let resultUrl = url;

    while ((match = paramRegex.exec(url)) !== null) {
      const paramName = match[1];
      const parentId = this.parents.get(paramName);

      if (!parentId) {
        throw new Error(`Missing required parent resource: ${paramName}`);
      }

      resultUrl = resultUrl.replace(`{${paramName}}`, parentId);
    }

    return resultUrl;
  }

  list(headers: string = ""): Promise<ResourceInstance[]> {
    const baseUrl = this.base_url();
    const url = this.substituteUrlParameters(`${this.server_url}${baseUrl}`);
    return List(url, this, headers);
  }

  get(resourceId: string, headers: string = ""): Promise<ResourceInstance> {
    const baseUrl = this.base_url();
    const url = this.substituteUrlParameters(`${this.server_url}${baseUrl}/${resourceId}`);
    return Get(url, this, headers);
  }

  create(body: object, headers: string = ""): Promise {
    const baseUrl = this.base_url();
    let url = `${this.server_url}${baseUrl}`;
    if (this.properties().find(prop => prop.name === 'id')) {
      url += `?id=${body.id}`;
    }
    url = this.substituteUrlParameters(url);
    return Create(url, body, headers);
  }

  base_url(): string {
    const pattern = this.schema["x-aep-resource"]["patterns"][0];
    const subset = pattern.substring(0, pattern.lastIndexOf("/"));
    if (subset[0] != "/") {
      return "/" + subset;
    }
    return subset;
  }

  properties(): PropertySchema[] {
    const properties: PropertySchema[] = [];
    for (const [name, schema] of Object.entries(this.schema.properties)) {
      properties.push(new PropertySchema(name, schema.type));
    }
    return properties;
  }

  parents(): string[] {
    const resource = this.schema["x-aep-resource"]
    if ('parents' in resource) {
      return resource.parents;
    } else {
      return [];
    }
  }
}

class PropertySchema {
  name: string
  type: string

  constructor(name: string, type: string) {
    this.name = name;
    this.type = type;
  }
}

class OpenAPI {
  schema: any;

  constructor(schema: any) {
    this.schema = schema;
  }

  resources(): ResourceSchema[] {
    const resources: ResourceSchema[] = [];

    if (this.schema?.components?.schemas) {
      for (const [name, schema] of Object.entries(
        this.schema.components.schemas,
      )) {
        if (Object.prototype.hasOwnProperty.call(schema, "x-aep-resource")) {
          resources.push(
            new ResourceSchema(
              schema["x-aep-resource"]["singular"],
              schema["x-aep-resource"]["plural"],
              schema,
              this.schema.servers[0].url,
            ),
          );
        }
      }
    }
    return resources;
  }

  parentResources(): ResourceSchema[] {
    return this.resources().filter((resource) => resource.parents().length == 0);
  }

  resourceForName(plural: string): ResourceSchema {
    const resources = this.resources();
    for (const resource of resources) {
      if (resource.plural_name === plural) {
        return resource;
      }
    }
    throw new Error(`Resource not found: ${plural}`);
  }

  childResources(r: ResourceSchema, id: string): ResourceSchema[] {
    const children: ResourceSchema[] = [];
    const allResources = this.resources();

    for (const resource of allResources) {
      const parents = resource.schema["x-aep-resource"]["parents"] || [];
      // Get all valid parent names (current resource + its parents)
      const validParents = new Set([r.singular_name, ...r.parents.keys()]);

      // Check if all parents in the resource's parents array are valid
      const allParentsValid =
        parents.length === validParents.size &&
        parents.every(parent => validParents.has(parent));

      if (allParentsValid) {
        // Copy parent relationships from the parent resource
        for (const [key, value] of r.parents.entries()) {
          resource.parents.set(key, value);
        }
        // Add the parent resource's ID
        resource.parents.set(r.singular_name, id);
        children.push(resource);
      }
    }

    return children;
  }
}

function parseOpenAPI(jsonString: string): OpenAPI {
  try {
    const parsed = JSON.parse(jsonString);
    return new OpenAPI(parsed);
  } catch (error) {
    throw new Error(
      `Failed to parse OpenAPI schema: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

export { OpenAPI, parseOpenAPI, ResourceSchema, PropertySchema };
