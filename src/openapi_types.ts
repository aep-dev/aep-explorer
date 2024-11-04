import { z } from "zod";

export const MediaTypeSchema = z.object({
  schema: z.lazy(() => SchemaSchema)
});

export const RequestBodySchema = z.object({
  required: z.boolean(),
  content: z.record(z.string(), MediaTypeSchema).optional(),
});

export const XAEPResourceSchema = z.object({
  singular: z.string().optional(),
  plural: z.string().optional(),
  patterns: z.array(z.string()).optional(),
  parents: z.array(z.string()).optional()
});

export const PropertiesSchema = z.record(z.string(), z.lazy(() => SchemaSchema));

export const SchemaSchema = z.object({
  $ref: z.string().optional(),
  type: z.string().optional(),
  format: z.string().optional(),
  required: z.array(z.string()).optional(),
  readOnly: z.boolean().optional(),
  items: z.lazy(() => SchemaSchema).optional(),
  properties: PropertiesSchema.optional(),
  "x-terraform-id": z.boolean().optional(),
  "x-aep-resource": XAEPResourceSchema.optional()
});

export const ParameterInfoSchema = z.object({
  in: z.string(),
  name: z.string(),
  schema: SchemaSchema,
  required: z.boolean().optional(),
  type: z.string().optional()
});

export const ResponseInfoSchema = z.object({
  description: z.string(),
});

export const ParametersSchema = z.array(ParameterInfoSchema);

export const ResponsesSchema = z.record(z.string(), ResponseInfoSchema);

export const MethodInfoSchema = z.object({
  responses: ResponsesSchema.optional(),
  parameters: ParametersSchema.optional(),
  requestBody: RequestBodySchema.optional()
});

export const MethodsSchema = z.record(z.string(), MethodInfoSchema);

export const PathsSchema = z.record(z.string(), MethodsSchema);

export const SchemasSchema = z.record(z.string(), SchemaSchema);

export const ComponentsSchema = z.object({
  schemas: SchemasSchema
});

export const InfoSchema = z.object({
  title: z.string(),
  version: z.string()
});

export const ServerSchema = z.object({
  url: z.string(),
  description: z.string().optional(),
  variables: z.record(z.string(), z.string()).optional()
});

export const OpenAPISchema = z.object({
  openapi: z.string(),
  servers: z.array(ServerSchema).optional(),
  info: InfoSchema,
  paths: PathsSchema,
  components: ComponentsSchema
});

export type OpenAPI = z.infer<typeof OpenAPISchema>;
export type Server = z.infer<typeof ServerSchema>;
export type Info = z.infer<typeof InfoSchema>;
export type Components = z.infer<typeof ComponentsSchema>;
export type Paths = z.infer<typeof PathsSchema>;
export type Methods = z.infer<typeof MethodsSchema>;
export type MethodInfo = z.infer<typeof MethodInfoSchema>;
export type Responses = z.infer<typeof ResponsesSchema>;
export type Parameters = z.infer<typeof ParametersSchema>;
export type ResponseInfo = z.infer<typeof ResponseInfoSchema>;
export type ParameterInfo = z.infer<typeof ParameterInfoSchema>;
export type Schema = z.infer<typeof SchemaSchema>;
export type Properties = z.infer<typeof PropertiesSchema>;
export type XAEPResource = z.infer<typeof XAEPResourceSchema>;
export type RequestBody = z.infer<typeof RequestBodySchema>;
export type MediaType = z.infer<typeof MediaTypeSchema>;