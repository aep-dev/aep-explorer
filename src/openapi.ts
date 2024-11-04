import { OpenAPISchema } from "./openapi_types";

class OpenAPI {
    schema: typeof OpenAPISchema    

    constructor(schema: typeof OpenAPISchema) {
        this.schema = schema;
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