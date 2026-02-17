import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { ResourceInstance, List, Create, Get, Delete, Patch } from "./fetch";
import { ResourceSchema } from "./openapi";
import { toast } from "@/hooks/use-toast";

// Mock the toast function
vi.mock("@/hooks/use-toast", () => ({
  toast: vi.fn(),
}));

// Mock global fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Create a mock ResourceSchema
const createMockResourceSchema = (): ResourceSchema => {
  return {
    server_url: "http://localhost:8080",
    singular_name: "test",
    plural_name: "tests",
    schema: {},
    parents: new Map(),
  } as ResourceSchema;
};

describe("fetch.ts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe("ResourceInstance", () => {
    it("creates a ResourceInstance correctly", () => {
      const schema = createMockResourceSchema();
      const instance = new ResourceInstance(
        "123",
        "test/123",
        { name: "Test" },
        schema,
      );

      expect(instance.id).toBe("123");
      expect(instance.path).toBe("test/123");
      expect(instance.properties).toEqual({ name: "Test" });
      expect(instance.schema).toBe(schema);
    });

    it("delete method calls Delete function with correct URL", async () => {
      const schema = createMockResourceSchema();
      const instance = new ResourceInstance(
        "123",
        "test/123",
        { name: "Test" },
        schema,
      );

      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: async () => "",
      });

      await instance.delete("Authorization: Bearer token");

      expect(mockFetch).toHaveBeenCalledWith("http://localhost:8080/test/123", {
        method: "DELETE",
        headers: new Map([["Authorization", "Bearer token"]]),
      });
    });

    it("update method calls Patch function with correct URL and body", async () => {
      const schema = createMockResourceSchema();
      const instance = new ResourceInstance(
        "123",
        "test/123",
        { name: "Test" },
        schema,
      );

      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: async () => "",
      });

      const updateData = { name: "Updated Test" };
      await instance.update(updateData, "Authorization: Bearer token");

      expect(mockFetch).toHaveBeenCalledWith("http://localhost:8080/test/123", {
        method: "PATCH",
        headers: new Map([["Authorization", "Bearer token"]]),
        body: JSON.stringify(updateData),
      });
    });
  });

  describe("List function", () => {
    it("successfully lists resources", async () => {
      const schema = createMockResourceSchema();
      const mockResponse = {
        results: [
          { id: "1", path: "test/1", name: "Test 1" },
          { id: "2", path: "test/2", name: "Test 2" },
        ],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: async () => JSON.stringify(mockResponse),
      });

      const result = await List("http://test.com/api", schema);

      expect(result).toHaveLength(2);
      expect(result[0]).toBeInstanceOf(ResourceInstance);
      expect(result[0].id).toBe("1");
      expect(result[1].id).toBe("2");
    });

    it("handles HTTP error status", async () => {
      const schema = createMockResourceSchema();

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        text: async () => "",
      });

      await expect(List("http://test.com/api", schema)).rejects.toThrow(
        "List failed with status 404",
      );
      expect(toast).toHaveBeenCalledWith({
        description: "List failed with status 404",
      });
    });

    it("handles HTTP error status with error field in response", async () => {
      const schema = createMockResourceSchema();
      const errorResponse = { error: "Resource not found" };

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        text: async () => JSON.stringify(errorResponse),
      });

      await expect(List("http://test.com/api", schema)).rejects.toThrow(
        "List failed: Resource not found",
      );
      expect(toast).toHaveBeenCalledWith({
        description: "List failed: Resource not found",
      });
    });

    it("handles HTTP error status with message field in response", async () => {
      const schema = createMockResourceSchema();
      const errorResponse = { message: "Invalid request parameters" };

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        text: async () => JSON.stringify(errorResponse),
      });

      await expect(List("http://test.com/api", schema)).rejects.toThrow(
        "List failed: Invalid request parameters",
      );
      expect(toast).toHaveBeenCalledWith({
        description: "List failed: Invalid request parameters",
      });
    });

    it("handles API error response with errors field", async () => {
      const schema = createMockResourceSchema();
      const errorResponse = {
        errors: ["Resource not found", "Invalid parameters"],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: async () => JSON.stringify(errorResponse),
      });

      await expect(List("http://test.com/api", schema)).rejects.toThrow(
        "API Error: Resource not found, Invalid parameters",
      );
      expect(toast).toHaveBeenCalledWith({
        description: "API Error: Resource not found, Invalid parameters",
      });
    });

    it("handles API error response with code and message", async () => {
      const schema = createMockResourceSchema();
      const errorResponse = {
        code: "400",
        message: "Bad Request",
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: async () => JSON.stringify(errorResponse),
      });

      await expect(List("http://test.com/api", schema)).rejects.toThrow(
        "400: Bad Request",
      );
      expect(toast).toHaveBeenCalledWith({
        description: "400: Bad Request",
      });
    });

    it("handles network errors", async () => {
      const schema = createMockResourceSchema();

      mockFetch.mockRejectedValueOnce(new Error("Network error"));

      await expect(List("http://test.com/api", schema)).rejects.toThrow(
        "Failed to list resources: Network error",
      );
      expect(toast).toHaveBeenCalledWith({
        description: "Failed to list resources: Network error",
      });
    });
  });

  describe("Get function", () => {
    it("successfully gets a resource", async () => {
      const schema = createMockResourceSchema();
      const mockResponse = { id: "1", path: "test/1", name: "Test Resource" };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: async () => JSON.stringify(mockResponse),
      });

      const result = await Get("http://test.com/api/1", schema);

      expect(result).toBeInstanceOf(ResourceInstance);
      expect(result.id).toBe("1");
      expect(result.path).toBe("test/1");
    });

    it("handles HTTP error status", async () => {
      const schema = createMockResourceSchema();

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        text: async () => "",
      });

      await expect(Get("http://test.com/api/1", schema)).rejects.toThrow(
        "Get failed with status 404",
      );
      expect(toast).toHaveBeenCalledWith({
        description: "Get failed with status 404",
      });
    });
  });

  describe("Create function", () => {
    it("successfully creates a resource", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: async () => "",
      });

      const createData = { name: "New Resource" };
      await expect(
        Create("http://test.com/api", createData),
      ).resolves.toBeUndefined();

      expect(mockFetch).toHaveBeenCalledWith("http://test.com/api", {
        method: "POST",
        headers: new Map(),
        body: JSON.stringify(createData),
      });
    });

    it("handles HTTP error status", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        text: async () => "",
      });

      await expect(Create("http://test.com/api", {})).rejects.toThrow(
        "Create failed with status 400",
      );
      expect(toast).toHaveBeenCalledWith({
        description: "Create failed with status 400",
      });
    });

    it("handles API error in response body", async () => {
      const errorResponse = {
        errors: "Validation failed",
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: async () => JSON.stringify(errorResponse),
      });

      await expect(Create("http://test.com/api", {})).rejects.toThrow(
        "API Error: Validation failed",
      );
      expect(toast).toHaveBeenCalledWith({
        description: "API Error: Validation failed",
      });
    });
  });

  describe("Delete function", () => {
    it("successfully deletes a resource", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: async () => "",
      });

      await expect(Delete("http://test.com/api/1")).resolves.toBeUndefined();

      expect(mockFetch).toHaveBeenCalledWith("http://test.com/api/1", {
        method: "DELETE",
        headers: new Map(),
      });
    });

    it("handles HTTP error status", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        text: async () => "",
      });

      await expect(Delete("http://test.com/api/1")).rejects.toThrow(
        "Delete failed with status 404",
      );
      expect(toast).toHaveBeenCalledWith({
        description: "Delete failed with status 404",
      });
    });
  });

  describe("Patch function", () => {
    it("successfully patches a resource", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: async () => "",
      });

      const patchData = { name: "Updated Resource" };
      await expect(
        Patch("http://test.com/api/1", patchData),
      ).resolves.toBeUndefined();

      expect(mockFetch).toHaveBeenCalledWith("http://test.com/api/1", {
        method: "PATCH",
        headers: new Map(),
        body: JSON.stringify(patchData),
      });
    });

    it("handles HTTP error status", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 422,
        text: async () => "",
      });

      await expect(Patch("http://test.com/api/1", {})).rejects.toThrow(
        "Patch failed with status 422",
      );
      expect(toast).toHaveBeenCalledWith({
        description: "Patch failed with status 422",
      });
    });
  });

  describe("Error detection", () => {
    it("detects errors field as string", async () => {
      const schema = createMockResourceSchema();
      const errorResponse = { errors: "Single error message" };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: async () => JSON.stringify(errorResponse),
      });

      await expect(List("http://test.com/api", schema)).rejects.toThrow(
        "API Error: Single error message",
      );
      expect(toast).toHaveBeenCalledWith({
        description: "API Error: Single error message",
      });
    });

    it("detects errors field as array", async () => {
      const schema = createMockResourceSchema();
      const errorResponse = { errors: ["Error 1", "Error 2", "Error 3"] };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: async () => JSON.stringify(errorResponse),
      });

      await expect(List("http://test.com/api", schema)).rejects.toThrow(
        "API Error: Error 1, Error 2, Error 3",
      );
      expect(toast).toHaveBeenCalledWith({
        description: "API Error: Error 1, Error 2, Error 3",
      });
    });

    it("detects code and message only response", async () => {
      const schema = createMockResourceSchema();
      const errorResponse = {
        code: "INVALID_REQUEST",
        message: "The request is invalid",
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: async () => JSON.stringify(errorResponse),
      });

      await expect(List("http://test.com/api", schema)).rejects.toThrow(
        "INVALID_REQUEST: The request is invalid",
      );
      expect(toast).toHaveBeenCalledWith({
        description: "INVALID_REQUEST: The request is invalid",
      });
    });

    it("does not detect errors in valid response with additional fields", async () => {
      const schema = createMockResourceSchema();
      const validResponse = {
        code: "SUCCESS",
        message: "Operation completed",
        data: { id: "1" },
        results: [{ id: "1", path: "test/1" }],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: async () => JSON.stringify(validResponse),
      });

      const result = await List("http://test.com/api", schema);
      expect(result).toHaveLength(1);
      expect(toast).not.toHaveBeenCalled();
    });
  });

  describe("Header parsing", () => {
    it("parses headers correctly", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: async () => JSON.stringify({ results: [] }),
      });

      const schema = createMockResourceSchema();
      await List(
        "http://test.com/api",
        schema,
        "Authorization: Bearer token, Content-Type: application/json",
      );

      expect(mockFetch).toHaveBeenCalledWith("http://test.com/api", {
        headers: new Map([
          ["Authorization", "Bearer token"],
          ["Content-Type", "application/json"],
        ]),
      });
    });

    it("handles empty headers string", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: async () => JSON.stringify({ results: [] }),
      });

      const schema = createMockResourceSchema();
      await List("http://test.com/api", schema, "");

      expect(mockFetch).toHaveBeenCalledWith("http://test.com/api", {
        headers: new Map(),
      });
    });
  });

  describe("Edge cases", () => {
    it("handles empty response body", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: async () => "",
      });

      await expect(Delete("http://test.com/api/1")).resolves.toBeUndefined();
      expect(toast).not.toHaveBeenCalled();
    });

    it("handles malformed JSON response", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: async () => "invalid json",
      });

      // With malformed JSON in a successful response, it should return null and not throw
      await expect(Delete("http://test.com/api/1")).resolves.toBeUndefined();
      expect(toast).not.toHaveBeenCalled();
    });

    it("re-throws API errors without double handling", async () => {
      const schema = createMockResourceSchema();
      const errorResponse = { errors: "API Error" };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: async () => JSON.stringify(errorResponse),
      });

      await expect(List("http://test.com/api", schema)).rejects.toThrow(
        "API Error: API Error",
      );

      // Toast should only be called once (from checkForApiErrors, not from handleError)
      expect(toast).toHaveBeenCalledTimes(1);
      expect(toast).toHaveBeenCalledWith({
        description: "API Error: API Error",
      });
    });
  });
});
