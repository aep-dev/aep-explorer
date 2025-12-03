import { describe, expect, it, beforeEach } from 'vitest';
import MockResourceStore, { MockResource } from './mock-store';

describe('MockResourceStore', () => {
  let store: MockResourceStore;

  beforeEach(() => {
    store = MockResourceStore.getInstance();
    store.reset();
  });

  describe('Singleton pattern', () => {
    it('returns the same instance', () => {
      const instance1 = MockResourceStore.getInstance();
      const instance2 = MockResourceStore.getInstance();

      expect(instance1).toBe(instance2);
    });

    it('maintains state across getInstance calls', () => {
      const instance1 = MockResourceStore.getInstance();
      instance1.create('http://example.com/books', { title: 'Test Book' });

      const instance2 = MockResourceStore.getInstance();
      const resources = instance2.getAllResources();

      expect(resources.size).toBe(1);
    });
  });

  describe('reset()', () => {
    it('clears all resources', () => {
      store.create('http://example.com/books', { title: 'Book 1' });
      store.create('http://example.com/books', { title: 'Book 2' });

      expect(store.getAllResources().size).toBe(2);

      store.reset();

      expect(store.getAllResources().size).toBe(0);
    });

    it('resets resource counters', () => {
      store.create('http://example.com/books', { title: 'Book 1' });
      store.reset();

      const newResource = store.create('http://example.com/books', { title: 'Book 2' });

      // After reset, ID counter should restart at 1
      expect(newResource.id).toBe('1');
    });
  });

  describe('create()', () => {
    it('creates a resource with generated ID', () => {
      const resource = store.create('http://example.com/books', { title: 'Test Book' });

      expect(resource.id).toBe('1');
      expect(resource.path).toBe('books/1');
      expect(resource.title).toBe('Test Book');
    });

    it('increments IDs for each resource type', () => {
      const book1 = store.create('http://example.com/books', { title: 'Book 1' });
      const book2 = store.create('http://example.com/books', { title: 'Book 2' });

      expect(book1.id).toBe('1');
      expect(book2.id).toBe('2');
    });

    it('maintains separate ID counters for different resource types', () => {
      const book = store.create('http://example.com/books', { title: 'Test Book' });
      const author = store.create('http://example.com/authors', { name: 'Test Author' });

      expect(book.id).toBe('1');
      expect(author.id).toBe('1');
    });

    it('creates nested resources with correct path', () => {
      const resource = store.create('http://example.com/publishers/123/books', {
        title: 'Nested Book'
      });

      expect(resource.id).toBe('1');
      expect(resource.path).toBe('publishers/123/books/1');
      expect(resource.title).toBe('Nested Book');
    });

    it('preserves all properties from contents', () => {
      const contents = {
        title: 'Test Book',
        author: 'John Doe',
        year: 2024,
        tags: ['fiction', 'adventure']
      };

      const resource = store.create('http://example.com/books', contents);

      expect(resource).toMatchObject(contents);
      expect(resource.id).toBeDefined();
      expect(resource.path).toBeDefined();
    });
  });

  describe('get()', () => {
    it('retrieves an existing resource', () => {
      const created = store.create('http://example.com/books', { title: 'Test Book' });
      const retrieved = store.get('http://example.com/books/1');

      expect(retrieved).toEqual(created);
    });

    it('retrieves nested resources', () => {
      const created = store.create('http://example.com/publishers/123/books', {
        title: 'Nested Book'
      });

      const retrieved = store.get('http://example.com/publishers/123/books/1');

      expect(retrieved).toEqual(created);
    });

    it('throws error when resource not found', () => {
      expect(() => {
        store.get('http://example.com/books/999');
      }).toThrow('Resource not found: books/999');
    });

    it('handles malformed URL gracefully', () => {
      expect(() => {
        store.get('not-a-valid-url');
      }).toThrow();
    });
  });

  describe('list()', () => {
    it('returns empty results when no resources exist', () => {
      const result = store.list('http://example.com/books');

      expect(result.results).toEqual([]);
    });

    it('returns all resources of the specified type', () => {
      store.create('http://example.com/books', { title: 'Book 1' });
      store.create('http://example.com/books', { title: 'Book 2' });
      store.create('http://example.com/books', { title: 'Book 3' });

      const result = store.list('http://example.com/books');

      expect(result.results).toHaveLength(3);
      expect(result.results[0].title).toBe('Book 1');
      expect(result.results[1].title).toBe('Book 2');
      expect(result.results[2].title).toBe('Book 3');
    });

    it('filters resources by type', () => {
      store.create('http://example.com/books', { title: 'Book 1' });
      store.create('http://example.com/authors', { name: 'Author 1' });
      store.create('http://example.com/books', { title: 'Book 2' });

      const books = store.list('http://example.com/books');
      const authors = store.list('http://example.com/authors');

      expect(books.results).toHaveLength(2);
      expect(authors.results).toHaveLength(1);
    });

    it('handles nested resource collections', () => {
      store.create('http://example.com/publishers/123/books', { title: 'Book 1' });
      store.create('http://example.com/publishers/123/books', { title: 'Book 2' });
      store.create('http://example.com/publishers/456/books', { title: 'Book 3' });

      const pub123Books = store.list('http://example.com/publishers/123/books');
      const pub456Books = store.list('http://example.com/publishers/456/books');

      expect(pub123Books.results).toHaveLength(2);
      expect(pub456Books.results).toHaveLength(1);
    });

    it('returns results in correct format', () => {
      store.create('http://example.com/books', { title: 'Book 1' });

      const result = store.list('http://example.com/books');

      expect(result).toHaveProperty('results');
      expect(Array.isArray(result.results)).toBe(true);
    });
  });

  describe('update()', () => {
    it('updates an existing resource', () => {
      store.create('http://example.com/books', { title: 'Original Title' });

      const updated = store.update('http://example.com/books/1', { title: 'Updated Title' });

      expect(updated.title).toBe('Updated Title');
      expect(updated.id).toBe('1');
      expect(updated.path).toBe('books/1');
    });

    it('merges updates with existing properties', () => {
      store.create('http://example.com/books', {
        title: 'Test Book',
        author: 'John Doe',
        year: 2024
      });

      const updated = store.update('http://example.com/books/1', {
        title: 'Updated Title'
      });

      expect(updated.title).toBe('Updated Title');
      expect(updated.author).toBe('John Doe');
      expect(updated.year).toBe(2024);
    });

    it('preserves id and path during update', () => {
      store.create('http://example.com/books', { title: 'Test Book' });

      const updated = store.update('http://example.com/books/1', {
        id: '999',
        path: 'different/path',
        title: 'Updated Title'
      });

      expect(updated.id).toBe('1');
      expect(updated.path).toBe('books/1');
      expect(updated.title).toBe('Updated Title');
    });

    it('updates nested resources', () => {
      store.create('http://example.com/publishers/123/books', { title: 'Original' });

      const updated = store.update('http://example.com/publishers/123/books/1', {
        title: 'Updated'
      });

      expect(updated.title).toBe('Updated');
    });

    it('throws error when resource not found', () => {
      expect(() => {
        store.update('http://example.com/books/999', { title: 'Updated' });
      }).toThrow('Resource not found: books/999');
    });

    it('persists updates', () => {
      store.create('http://example.com/books', { title: 'Original Title' });
      store.update('http://example.com/books/1', { title: 'Updated Title' });

      const retrieved = store.get('http://example.com/books/1');

      expect(retrieved.title).toBe('Updated Title');
    });
  });

  describe('delete()', () => {
    it('deletes an existing resource', () => {
      store.create('http://example.com/books', { title: 'Test Book' });

      expect(store.getAllResources().size).toBe(1);

      store.delete('http://example.com/books/1');

      expect(store.getAllResources().size).toBe(0);
    });

    it('throws error when resource not found', () => {
      expect(() => {
        store.delete('http://example.com/books/999');
      }).toThrow('Resource not found: books/999');
    });

    it('deletes nested resources', () => {
      store.create('http://example.com/publishers/123/books', { title: 'Test Book' });

      store.delete('http://example.com/publishers/123/books/1');

      const list = store.list('http://example.com/publishers/123/books');
      expect(list.results).toHaveLength(0);
    });

    it('only deletes the specified resource', () => {
      store.create('http://example.com/books', { title: 'Book 1' });
      store.create('http://example.com/books', { title: 'Book 2' });
      store.create('http://example.com/books', { title: 'Book 3' });

      store.delete('http://example.com/books/2');

      const list = store.list('http://example.com/books');
      expect(list.results).toHaveLength(2);
      expect(list.results[0].id).toBe('1');
      expect(list.results[1].id).toBe('3');
    });
  });

  describe('getAllResources()', () => {
    it('returns all resources as a Map', () => {
      store.create('http://example.com/books', { title: 'Book 1' });
      store.create('http://example.com/authors', { name: 'Author 1' });

      const all = store.getAllResources();

      expect(all).toBeInstanceOf(Map);
      expect(all.size).toBe(2);
    });

    it('returns a copy of the resources Map', () => {
      store.create('http://example.com/books', { title: 'Book 1' });

      const all = store.getAllResources();
      all.clear();

      // Original store should still have resources
      expect(store.getAllResources().size).toBe(1);
    });
  });

  describe('Edge cases', () => {
    it('handles URLs with trailing slashes', () => {
      const resource = store.create('http://example.com/books/', { title: 'Test Book' });

      expect(resource.path).toBe('books/1');
    });

    it('handles URLs with query parameters', () => {
      const resource = store.create('http://example.com/books?filter=new', {
        title: 'Test Book'
      });

      expect(resource.path).toBe('books/1');
    });

    it('handles empty contents object', () => {
      const resource = store.create('http://example.com/books', {});

      expect(resource.id).toBeDefined();
      expect(resource.path).toBeDefined();
    });

    it('handles deeply nested resources', () => {
      const resource = store.create(
        'http://example.com/publishers/1/departments/2/sections/3/books',
        { title: 'Deeply Nested Book' }
      );

      expect(resource.path).toBe('publishers/1/departments/2/sections/3/books/1');
    });

    it('handles resource type extraction from complex URLs', () => {
      const resource1 = store.create('http://example.com/v1/api/books', {
        title: 'Book 1'
      });
      const resource2 = store.create('http://different.com/v1/api/books', {
        title: 'Book 2'
      });

      // Different domains but same path structure should maintain separate counters
      expect(resource1.id).toBe('1');
      expect(resource2.id).toBe('2');
    });
  });

  describe('Complex scenarios', () => {
    it('handles complete CRUD lifecycle', () => {
      // Create
      const created = store.create('http://example.com/books', {
        title: 'Original',
        author: 'John Doe'
      });
      expect(created.id).toBe('1');

      // Read
      const retrieved = store.get('http://example.com/books/1');
      expect(retrieved.title).toBe('Original');

      // Update
      const updated = store.update('http://example.com/books/1', {
        title: 'Updated'
      });
      expect(updated.title).toBe('Updated');
      expect(updated.author).toBe('John Doe');

      // Delete
      store.delete('http://example.com/books/1');
      expect(() => store.get('http://example.com/books/1')).toThrow();
    });

    it('handles multiple resource types with nested relationships', () => {
      // Create publishers
      store.create('http://example.com/publishers', { name: 'Publisher 1' });
      store.create('http://example.com/publishers', { name: 'Publisher 2' });

      // Create books under different publishers
      store.create('http://example.com/publishers/1/books', { title: 'Book 1A' });
      store.create('http://example.com/publishers/1/books', { title: 'Book 1B' });
      store.create('http://example.com/publishers/2/books', { title: 'Book 2A' });

      // Verify isolation
      const pub1Books = store.list('http://example.com/publishers/1/books');
      const pub2Books = store.list('http://example.com/publishers/2/books');
      const publishers = store.list('http://example.com/publishers');

      expect(publishers.results).toHaveLength(2);
      expect(pub1Books.results).toHaveLength(2);
      expect(pub2Books.results).toHaveLength(1);
    });

    it('handles concurrent operations on the same store', () => {
      // Simulate concurrent creates
      const book1 = store.create('http://example.com/books', { title: 'Book 1' });
      const book2 = store.create('http://example.com/books', { title: 'Book 2' });
      const book3 = store.create('http://example.com/books', { title: 'Book 3' });

      // All should have unique IDs
      expect(book1.id).toBe('1');
      expect(book2.id).toBe('2');
      expect(book3.id).toBe('3');

      // List should contain all
      const list = store.list('http://example.com/books');
      expect(list.results).toHaveLength(3);
    });
  });
});
