import { toast } from "@/hooks/use-toast";
import { ResourceSchema } from "./openapi";

class ResourceInstance {
  id: string
  path: string
  properties: object
  schema: ResourceSchema

  constructor(id: string, path: string, properties: object, r: ResourceSchema) {
    this.id = id;
    this.path = path;
    this.properties = properties;
    this.schema = r;
  }

  async delete() {
    const url = `${this.schema.server_url}/${this.path}`
    return Delete(url);
  }

  async update(value: object): Promise<void> {
    const url = `${this.schema.server_url}/${this.path}`
    return Patch(url, value);
  }
}

async function List(url: string, r: ResourceSchema): Promise<ResourceInstance[]> {
    let response = await fetch(url);
    const results: ResourceInstance[] = [];
    const list_response = await response.json();
    for(const result of list_response.results) {
        results.push(new ResourceInstance(result['id'], result['path'], result, r));
    }
    return results;
}

async function Delete(url: string) {
  try {
    const response = await fetch(url, {
      method: 'DELETE'
    });
    if (!response.ok) {
        toast({description: `Delete failed with status ${response.status}`})
    }
    return;
  } catch (error) {
    toast({description: `Failed to delete resource: ${error instanceof Error ? error.message : String(error)}`});
  }
}

async function Get(url: string, r: ResourceSchema): Promise<ResourceInstance> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
        toast({description: `Get failed with status ${response.status}`})
    }
    const result = await response.json();
    return new ResourceInstance(result['id'], result['path'], result, r);
  } catch (error) {
    toast({description: `Failed to get resource: ${error instanceof Error ? error.message : String(error)}`});
  }
}

async function Create(url: string, contents: object) {
try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(contents),
    });
    if (!response.ok) {
      toast({description: `Create failed with status ${response.status}`});
    }
  } catch (error) {
    toast({description: `Failed to create resource: ${error instanceof Error ? error.message : String(error)}`});
  }
}

async function Patch(url: string, contents: object) {
try {
    const response = await fetch(url, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(contents),
    });
    if (!response.ok) {
      toast({description: `Patch failed with status ${response.status}`});
    }
  } catch (error) {
    toast({description: `Failed to patch resource: ${error instanceof Error ? error.message : String(error)}`});
  }
}

export {ResourceInstance, List, Create, Get}
