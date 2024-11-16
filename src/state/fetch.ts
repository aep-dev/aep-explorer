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

export {ResourceInstance, List}
