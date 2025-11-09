import { List, ResourceInstance, Create, Get } from './fetch';
import { Resource, Schema, APIClient } from '@aep_dev/aep-lib-ts';

// Adapter class that wraps aep-lib-ts Resource with additional UI-specific functionality
class ResourceSchema {
  private resource: Resource;
  server_url: string;
  parents: Map<string, string>;

  constructor(resource: Resource, server_url: string) {
    this.resource = resource;
    this.server_url = server_url;
    this.parents = new Map();
  }

  get singular_name(): string {
    return this.resource.singular;
  }

  get plural_name(): string {
    return this.resource.plural;
  }

  get schema(): Schema {
    return this.resource.schema;
  }

  public substituteUrlParameters(url: string): string {
    const paramRegex = /\{([^}]+)\}/g;
    let match;
    let resultUrl = url;

    while ((match = paramRegex.exec(url)) !== null) {
      const paramName = match[1];
      let parentId = this.parents.get(paramName);

      if (!parentId) {
        // Try removing _id suffix if present
        if (paramName.endsWith('_id')) {
          const nameWithoutSuffix = paramName.slice(0, -3);
          parentId = this.parents.get(nameWithoutSuffix);
        }

        if (!parentId) {
          const parentsMap = Object.fromEntries(this.parents);
          throw new Error(`Missing required parent resource: ${paramName}. Available parents: ${JSON.stringify(parentsMap)}`);
        }
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
    const pattern = this.resource.schema["x-aep-resource"]?.patterns?.[0];
    if (!pattern) {
      throw new Error(`No pattern found for resource ${this.resource.singular}`);
    }
    const subset = pattern.substring(0, pattern.lastIndexOf("/"));
    if (subset[0] != "/") {
      return "/" + subset;
    }
    return subset;
  }

  properties(): PropertySchema[] {
    const properties: PropertySchema[] = [];
    if (this.resource.schema.properties) {
      for (const [name, schema] of Object.entries(this.resource.schema.properties)) {
        properties.push(new PropertySchema(name, schema.type || 'object', schema));
      }
    }
    return properties;
  }

  required(): string[] {
    return this.resource.schema.required || [];
  }

  parentResources(): string[] {
    return this.resource.parents.map(p => p.singular);
  }
}

class PropertySchema {
  name: string
  type: string
  schema: Schema

  constructor(name: string, type: string, schema: Schema) {
    this.name = name;
    this.type = type;
    this.schema = schema;
  }

  properties(): PropertySchema[] {
    if (this.type === 'object' && this.schema?.properties) {
      const properties: PropertySchema[] = [];
      for (const [name, schema] of Object.entries(this.schema.properties)) {
        properties.push(new PropertySchema(name, schema.type || 'object', schema));
      }
      return properties;
    }
    return [];
  }

  required(): string[] {
    if (this.type === 'object' && this.schema?.required) {
      return this.schema.required;
    }
    return [];
  }
}

// Adapter class that wraps aep-lib-ts APIClient with UI-specific functionality
class OpenAPI {
  private apiClient: { resources: () => Record<string, Resource>; serverUrl: () => string } | null = null;
  private serverUrl: string = '';
  private _resources: ResourceSchema[] | null = null;

  constructor(
    apiClient: { resources: () => Record<string, Resource>; serverUrl: () => string } | null = null,
    serverUrl?: string
  ) {
    this.apiClient = apiClient;
    if (serverUrl) {
      this.serverUrl = serverUrl;
    } else if (apiClient) {
      this.serverUrl = apiClient.serverUrl();
    }
  }

  resources(): ResourceSchema[] {
    if (this._resources) {
      return this._resources;
    }

    if (!this.apiClient) {
      return [];
    }

    const resources: ResourceSchema[] = [];
    const resourceMap = this.apiClient.resources();

    for (const resource of Object.values(resourceMap)) {
      resources.push(new ResourceSchema(resource, this.serverUrl));
    }

    this._resources = resources;
    return resources;
  }

  parentResources(): ResourceSchema[] {
    return this.resources().filter((resource) => resource.parentResources().length == 0);
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
      const parents = resource.schema["x-aep-resource"]?.parents || [];
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

// Helper function to create OpenAPI from raw JSON using aep-lib-ts
async function parseOpenAPI(jsonString: string): Promise<OpenAPI> {
  try {
    const parsed = JSON.parse(jsonString);
    const apiClient = await APIClient.fromOpenAPI(parsed);
    return new OpenAPI(apiClient);
  } catch (error) {
    throw new Error(
      `Failed to parse OpenAPI schema: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

export { OpenAPI, parseOpenAPI, ResourceSchema, PropertySchema };
