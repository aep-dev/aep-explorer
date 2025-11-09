import { toast } from "@/hooks/use-toast";
import { ResourceSchema } from "./openapi";

// Helper function to check for API errors in response body
function checkForApiErrors(responseData: any): void {
  // Check if response contains 'errors' field
  if (responseData && responseData.errors) {
    const errorMessage = Array.isArray(responseData.errors) 
      ? responseData.errors.join(', ')
      : String(responseData.errors);
    toast({description: `API Error: ${errorMessage}`});
    throw new Error(`API Error: ${errorMessage}`);
  }
  
  // Check if response contains only 'code' and 'message' fields (error format)
  if (responseData && 
      responseData.code && 
      responseData.message && 
      Object.keys(responseData).length === 2) {
    const errorMessage = `${responseData.code}: ${responseData.message}`;
    toast({description: errorMessage});
    throw new Error(errorMessage);
  }
}

// Consolidated error handling function
async function handleResponse(response: Response, operation: string): Promise<any> {
  // Always try to parse the response body first, even if response is not ok
  const text = await response.text();
  let responseData = null;
  
  if (text) {
    try {
      responseData = JSON.parse(text);
    } catch (e) {
      // If we can't parse JSON, fall back to generic error handling
    }
  }
  
  if (!response.ok) {
    // Check if response has error or message field
    if (responseData) {
      if (responseData.error) {
        const errorMessage = `${operation} failed: ${responseData.error}`;
        toast({description: errorMessage});
        throw new Error(errorMessage);
      }
      if (responseData.message) {
        const errorMessage = `${operation} failed: ${responseData.message}`;
        toast({description: errorMessage});
        throw new Error(errorMessage);
      }
    }
    
    // Fallback to generic status error
    toast({description: `${operation} failed with status ${response.status}`});
    throw new Error(`${operation} failed with status ${response.status}`);
  }
  
  // For successful responses, check for API errors in the usual way
  if (responseData) {
    checkForApiErrors(responseData);
    return responseData;
  }
  
  return null;
}

// Helper to catch and handle errors consistently
function handleError(error: unknown, operation: string): never {
  if (error instanceof Error && error.message.includes('API Error')) {
    throw error; // Re-throw API errors (already handled)
  }
  const message = `Failed to ${operation.toLowerCase()}: ${error instanceof Error ? error.message : String(error)}`;
  toast({description: message});
  throw new Error(message);
}

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
    try {
        const response = await fetch(url, {headers: getHeaders(headersString) as HeadersInit});
        const list_response = await handleResponse(response, 'List');

        const results: ResourceInstance[] = [];
        if (list_response?.results && Array.isArray(list_response.results)) {
            for(const result of list_response.results) {
                results.push(new ResourceInstance(result['id'], result['path'], result, r));
            }
        }
        return results;
    } catch (error) {
        handleError(error, 'list resources');
    }
}

async function Delete(url: string, headers: string = ""): Promise<void> {
  try {
    const response = await fetch(url, {
      method: 'DELETE',
      headers: getHeaders(headers) as HeadersInit
    });
    
    await handleResponse(response, 'Delete');
  } catch (error) {
    handleError(error, 'delete resource');
  }
}

async function Get(url: string, r: ResourceSchema, headersString: string = ""): Promise<ResourceInstance> {
  try {
    const response = await fetch(url, { headers: getHeaders(headersString) as HeadersInit});
    const result = await handleResponse(response, 'Get');
    
    return new ResourceInstance(result['id'], result['path'], result, r);
  } catch (error) {
    handleError(error, 'get resource');
  }
}

async function Create(url: string, contents: object, headersString: string = ""): Promise<void> {
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: getHeaders(headersString) as HeadersInit,
      body: JSON.stringify(contents),
    });
    
    await handleResponse(response, 'Create');
  } catch (error) {
    handleError(error, 'create resource');
  }
}

async function Patch(url: string, contents: object, headersString: string = ""): Promise<void> {
  try {
    const response = await fetch(url, {
      method: 'PATCH',
      headers: getHeaders(headersString) as HeadersInit,
      body: JSON.stringify(contents),
    });
    
    await handleResponse(response, 'Patch');
  } catch (error) {
    handleError(error, 'patch resource');
  }
}

export {ResourceInstance, List, Create, Get, Delete, Patch}
