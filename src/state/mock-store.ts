/**
 * MockResourceStore - In-memory storage for mocked resource operations
 *
 * This class provides a mock implementation of a resource server that stores
 * resources in memory using a HashMap. It's used when the mock server is enabled
 * to avoid making real network calls.
 */

interface MockResource {
  id: string;
  path: string;
  [key: string]: unknown; // Allow arbitrary properties
}

class MockResourceStore {
  private static instance: MockResourceStore;
  private resources: Map<string, MockResource>;
  private resourceCounters: Map<string, number>; // Track IDs per resource type

  private constructor() {
    this.resources = new Map();
    this.resourceCounters = new Map();
  }

  static getInstance(): MockResourceStore {
    if (!MockResourceStore.instance) {
      MockResourceStore.instance = new MockResourceStore();
    }
    return MockResourceStore.instance;
  }

  /**
   * Reset the mock store (useful for testing or clearing data)
   */
  reset(): void {
    this.resources.clear();
    this.resourceCounters.clear();
  }

  /**
   * Extract resource type from URL
   * e.g., "http://example.com/publishers/123/books" -> "books"
   */
  private extractResourceType(url: string): string {
    try {
      const urlObj = new URL(url);
      const pathSegments = urlObj.pathname
        .split("/")
        .filter((s) => s.length > 0);
      // Return the last segment as the resource type
      return pathSegments[pathSegments.length - 1] || "resource";
    } catch {
      return "resource";
    }
  }

  /**
   * Extract parent path from URL
   * e.g., "http://example.com/publishers/123/books" -> "publishers/123"
   */
  private extractParentPath(url: string): string {
    try {
      const urlObj = new URL(url);
      const pathSegments = urlObj.pathname
        .split("/")
        .filter((s) => s.length > 0);
      // Remove the last segment (resource type) to get parent path
      pathSegments.pop();
      return pathSegments.join("/");
    } catch {
      return "";
    }
  }

  /**
   * Generate the next ID for a resource type
   */
  private generateId(resourceType: string): string {
    const current = this.resourceCounters.get(resourceType) || 0;
    const nextId = current + 1;
    this.resourceCounters.set(resourceType, nextId);
    return `${nextId}`;
  }

  /**
   * Build full path for a resource
   */
  private buildResourcePath(
    parentPath: string,
    resourceType: string,
    id: string,
  ): string {
    const parts = [parentPath, resourceType, id].filter((p) => p.length > 0);
    return parts.join("/");
  }

  /**
   * List all resources matching the URL pattern
   * Returns resources in the format: { results: [...] }
   */
  list(url: string): { results: MockResource[] } {
    const resourceType = this.extractResourceType(url);
    const parentPath = this.extractParentPath(url);

    const results: MockResource[] = [];

    // Find all resources that match the pattern
    for (const [path, resource] of this.resources.entries()) {
      // Check if this resource belongs to the requested collection
      const resourceParentPath = this.extractParentPathFromFullPath(path);
      const resourceTypeFromPath = this.extractResourceTypeFromFullPath(path);

      if (
        resourceTypeFromPath === resourceType &&
        resourceParentPath === parentPath
      ) {
        results.push(resource);
      }
    }

    return { results };
  }

  /**
   * Get a specific resource by URL
   */
  get(url: string): MockResource {
    try {
      const urlObj = new URL(url);
      const path = urlObj.pathname.substring(1); // Remove leading slash

      const resource = this.resources.get(path);
      if (!resource) {
        throw new Error(`Resource not found: ${path}`);
      }

      return resource;
    } catch (error) {
      throw new Error(
        `Failed to get resource: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * Create a new resource
   */
  create(url: string, contents: object): MockResource {
    const resourceType = this.extractResourceType(url);
    const parentPath = this.extractParentPath(url);
    const id = this.generateId(resourceType);
    const path = this.buildResourcePath(parentPath, resourceType, id);

    const resource: MockResource = {
      id,
      path,
      ...contents,
    };

    this.resources.set(path, resource);
    return resource;
  }

  /**
   * Update an existing resource
   */
  update(url: string, contents: object): MockResource {
    try {
      const urlObj = new URL(url);
      const path = urlObj.pathname.substring(1); // Remove leading slash

      const existing = this.resources.get(path);
      if (!existing) {
        throw new Error(`Resource not found: ${path}`);
      }

      // Merge the updates with existing resource
      const updated: MockResource = {
        ...existing,
        ...contents,
        id: existing.id, // Preserve ID
        path: existing.path, // Preserve path
      };

      this.resources.set(path, updated);
      return updated;
    } catch (error) {
      throw new Error(
        `Failed to update resource: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * Delete a resource
   */
  delete(url: string): void {
    try {
      const urlObj = new URL(url);
      const path = urlObj.pathname.substring(1); // Remove leading slash

      if (!this.resources.has(path)) {
        throw new Error(`Resource not found: ${path}`);
      }

      this.resources.delete(path);
    } catch (error) {
      throw new Error(
        `Failed to delete resource: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * Helper to extract parent path from a full resource path
   * e.g., "publishers/123/books/456" -> "publishers/123"
   */
  private extractParentPathFromFullPath(fullPath: string): string {
    const segments = fullPath.split("/").filter((s) => s.length > 0);
    // Remove last two segments (resourceType and id)
    segments.pop(); // Remove id
    segments.pop(); // Remove resource type
    return segments.join("/");
  }

  /**
   * Helper to extract resource type from a full resource path
   * e.g., "publishers/123/books/456" -> "books"
   */
  private extractResourceTypeFromFullPath(fullPath: string): string {
    const segments = fullPath.split("/").filter((s) => s.length > 0);
    // Resource type is second to last segment
    if (segments.length >= 2) {
      return segments[segments.length - 2];
    }
    return "";
  }

  /**
   * Get all resources (for debugging)
   */
  getAllResources(): Map<string, MockResource> {
    return new Map(this.resources);
  }
}

export default MockResourceStore;
export type { MockResource };
