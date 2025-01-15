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

  async delete(headers: string = "") {
    const url = `${this.schema.server_url}/${this.path}`
    return Delete(url, headers);
  }

  async update(value: object, headers: string = ""): Promise<void> {
    const url = `${this.schema.server_url}/${this.path}`
    return Patch(url, value, headers);
  }
}

function getHeaders(headers: string): object {
  if(!headers) {
    return new Map();
  }

  console.log("headers " + headers)
  const headersMap = new Map();
  const headersArray = headers.split(',');
  headersArray.forEach(header => {
    const [key, value] = header.split(':');
    headersMap.set(key.trim(), value.trim());
  });
  return headersMap;

}

async function List(url: string, r: ResourceSchema, headersString: string = ""): Promise<ResourceInstance[]> {
    let response = await fetch(url, {headers: getHeaders(headersString)});
    const results: ResourceInstance[] = [];
    const list_response = await response.json();
    for(const result of list_response.results) {
        results.push(new ResourceInstance(result['id'], result['path'], result, r));
    }
    return results;
}

async function Delete(url: string, headers: string = "") {
  try {
    const response = await fetch(url, {
      method: 'DELETE',
      headers: getHeaders(headers)
    });
    if (!response.ok) {
        toast({description: `Delete failed with status ${response.status}`})
    }
    return;
  } catch (error) {
    toast({description: `Failed to delete resource: ${error instanceof Error ? error.message : String(error)}`});
  }
}

async function Get(url: string, r: ResourceSchema, headersString: string = ""): Promise<ResourceInstance> {
  try {
    const response = await fetch(url, { headers: getHeaders(headersString)});
    if (!response.ok) {
        toast({description: `Get failed with status ${response.status}`})
    }
    const result = await response.json();
    return new ResourceInstance(result['id'], result['path'], result, r);
  } catch (error) {
    toast({description: `Failed to get resource: ${error instanceof Error ? error.message : String(error)}`});
  }
}

async function Create(url: string, contents: object, headersString: string = "") {
try {
    const response = await fetch(url, {
      method: 'POST',
      headers: getHeaders(headersString),
      body: JSON.stringify(contents),
    });
    if (!response.ok) {
      toast({description: `Create failed with status ${response.status}`});
    }
  } catch (error) {
    toast({description: `Failed to create resource: ${error instanceof Error ? error.message : String(error)}`});
  }
}

async function Patch(url: string, contents: object, headersString: string = "") {
try {
    const response = await fetch(url, {
      method: 'PATCH',
      headers: getHeaders(headersString),
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
