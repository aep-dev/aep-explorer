import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import AppBreadcrumb from './breadcrumb';
import { createRouteObjects } from '@/lib/utils';
import { ResourceSchema } from '@/state/openapi';
import fs from 'fs';
import { parseOpenAPI } from '@/state/openapi';

// Mock react-router-dom's useMatches
const mockUseMatches = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useMatches: () => mockUseMatches(),
  };
});

// Mock Redux hooks
vi.mock('@/hooks/store', () => ({
  useAppSelector: vi.fn(),
}));

// Import after mocking
import { useAppSelector } from '@/hooks/store';

describe('createRouteObjects', () => {
  it('should capitalize plural names', () => {
    const mockResource = {
      plural_name: 'books',
      singular_name: 'book',
      base_url: () => '/books',
    } as unknown as ResourceSchema;

    const routeObjects = createRouteObjects([mockResource]);

    expect(routeObjects['/books']).toBe('Books'); // Capitalized
  });

  it('should handle multiple resources with capitalization', () => {
    const mockResources = [
      {
        plural_name: 'publishers',
        singular_name: 'publisher',
        base_url: () => '/publishers',
      },
      {
        plural_name: 'books',
        singular_name: 'book',
        base_url: () => '/books',
      },
    ] as unknown as ResourceSchema[];

    const routeObjects = createRouteObjects(mockResources);

    expect(routeObjects['/publishers']).toBe('Publishers');
    expect(routeObjects['/books']).toBe('Books');
  });

  it('should return base routes when resources is null', () => {
    const routeObjects = createRouteObjects(null as any);

    expect(routeObjects).toEqual({ '/': 'Home' });
  });

  it('should create routes for all resource paths', () => {
    const mockResource = {
      plural_name: 'books',
      singular_name: 'book',
      base_url: () => '/books',
    } as unknown as ResourceSchema;

    const routeObjects = createRouteObjects([mockResource]);

    expect(routeObjects['/books']).toBe('Books');
    expect(routeObjects['/books/_create']).toBe('book Create');
    expect(routeObjects['/books/{resourceId}']).toBe('book Info');
    expect(routeObjects['/books/{resourceId}/_update']).toBe('book Update');
  });

  it('works with real OpenAPI schema', async () => {
    const fileContents = fs.readFileSync('src/example_oas.json', 'utf8');
    const openAPI = await parseOpenAPI(fileContents);
    const resources = openAPI.resources();

    const routeObjects = createRouteObjects(resources);

    // Check that routes exist for all resources
    expect(routeObjects['/publishers']).toBe('Publishers');
    expect(routeObjects['/publishers/{publisher}/books']).toBe('Books');
    expect(routeObjects['/publishers/{publisher}/books/{book}/editions']).toBe('Book-editions');
    expect(routeObjects['/isbns']).toBe('Isbns');
  });
});

describe('AppBreadcrumb', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render breadcrumbs for simple paths', () => {
    const mockResources = [
      {
        plural_name: 'books',
        singular_name: 'book',
        base_url: () => '/books',
      },
    ] as unknown as ResourceSchema[];

    (useAppSelector as any).mockReturnValue(mockResources);
    mockUseMatches.mockReturnValue([
      { pathname: '/', params: {} },
      { pathname: '/books', params: {} },
    ]);

    render(
      <BrowserRouter>
        <AppBreadcrumb />
      </BrowserRouter>
    );

    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Books')).toBeInTheDocument();

    // Home should be a link
    const homeLink = screen.getByRole('link', { name: 'Home' });
    expect(homeLink).toHaveAttribute('href', '/');

    // Books is the last item, so it should NOT be a link
    const booksElement = screen.getByText('Books');
    expect(booksElement.tagName).toBe('SPAN');
    expect(booksElement).toHaveAttribute('aria-current', 'page');
  });

  it('should substitute params and render breadcrumbs correctly', () => {
    const mockResources = [
      {
        plural_name: 'books',
        singular_name: 'book',
        base_url: () => '/books',
      },
    ] as unknown as ResourceSchema[];

    (useAppSelector as any).mockReturnValue(mockResources);
    mockUseMatches.mockReturnValue([
      { pathname: '/', params: {} },
      { pathname: '/books', params: {} },
      { pathname: '/books/123', params: { resourceId: '123' } },
    ]);

    render(
      <BrowserRouter>
        <AppBreadcrumb />
      </BrowserRouter>
    );

    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Books')).toBeInTheDocument();
    expect(screen.getByText('book Info')).toBeInTheDocument();

    // Home and Books should be links with correct hrefs
    const homeLink = screen.getByRole('link', { name: 'Home' });
    expect(homeLink).toHaveAttribute('href', '/');

    const booksLink = screen.getByRole('link', { name: 'Books' });
    expect(booksLink).toHaveAttribute('href', '/books');

    // book Info is the last item, so it should NOT be a link
    const bookInfoElement = screen.getByText('book Info');
    expect(bookInfoElement.tagName).toBe('SPAN');
    expect(bookInfoElement).toHaveAttribute('aria-current', 'page');
  });

  it('should handle create routes', () => {
    const mockResources = [
      {
        plural_name: 'books',
        singular_name: 'book',
        base_url: () => '/books',
      },
    ] as unknown as ResourceSchema[];

    (useAppSelector as any).mockReturnValue(mockResources);
    mockUseMatches.mockReturnValue([
      { pathname: '/', params: {} },
      { pathname: '/books', params: {} },
      { pathname: '/books/_create', params: {} },
    ]);

    render(
      <BrowserRouter>
        <AppBreadcrumb />
      </BrowserRouter>
    );

    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Books')).toBeInTheDocument();
    expect(screen.getByText('book Create')).toBeInTheDocument();

    // Home and Books should be links
    expect(screen.getByRole('link', { name: 'Home' })).toHaveAttribute('href', '/');
    expect(screen.getByRole('link', { name: 'Books' })).toHaveAttribute('href', '/books');

    // book Create is the last item, so it should NOT be a link
    const createElement = screen.getByText('book Create');
    expect(createElement.tagName).toBe('SPAN');
    expect(createElement).toHaveAttribute('aria-current', 'page');
  });

  it('should handle update routes with param substitution', () => {
    const mockResources = [
      {
        plural_name: 'books',
        singular_name: 'book',
        base_url: () => '/books',
      },
    ] as unknown as ResourceSchema[];

    (useAppSelector as any).mockReturnValue(mockResources);
    mockUseMatches.mockReturnValue([
      { pathname: '/', params: {} },
      { pathname: '/books', params: {} },
      { pathname: '/books/456', params: { resourceId: '456' } },
      { pathname: '/books/456/_update', params: { resourceId: '456' } },
    ]);

    render(
      <BrowserRouter>
        <AppBreadcrumb />
      </BrowserRouter>
    );

    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Books')).toBeInTheDocument();
    expect(screen.getByText('book Info')).toBeInTheDocument();
    expect(screen.getByText('book Update')).toBeInTheDocument();

    // First three should be links with correct hrefs
    expect(screen.getByRole('link', { name: 'Home' })).toHaveAttribute('href', '/');
    expect(screen.getByRole('link', { name: 'Books' })).toHaveAttribute('href', '/books');
    expect(screen.getByRole('link', { name: 'book Info' })).toHaveAttribute('href', '/books/456');

    // book Update is the last item, so it should NOT be a link
    const updateElement = screen.getByText('book Update');
    expect(updateElement.tagName).toBe('SPAN');
    expect(updateElement).toHaveAttribute('aria-current', 'page');
  });

  it('should throw descriptive error when route is not found', () => {
    const mockResources = [] as ResourceSchema[];

    (useAppSelector as any).mockReturnValue(mockResources);
    mockUseMatches.mockReturnValue([
      { pathname: '/unknown/path', params: {} },
    ]);

    // Suppress console.error for this test
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => {
      render(
        <BrowserRouter>
          <AppBreadcrumb />
        </BrowserRouter>
      );
    }).toThrow('Breadcrumb route not found');

    consoleError.mockRestore();
  });

  it('should throw error with debugging information', () => {
    const mockResources = [] as ResourceSchema[];

    (useAppSelector as any).mockReturnValue(mockResources);
    mockUseMatches.mockReturnValue([
      { pathname: '/unknown/123', params: { id: '123' } },
    ]);

    // Suppress console.error for this test
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => {
      render(
        <BrowserRouter>
          <AppBreadcrumb />
        </BrowserRouter>
      );
    }).toThrow(/Original pathname.*Template path.*Params.*Available routes/);

    consoleError.mockRestore();
  });

  it('should handle multiple params in a path', () => {
    const mockResources = [
      {
        plural_name: 'books',
        singular_name: 'book',
        base_url: () => '/publishers/{publisherId}/books',
      },
    ] as unknown as ResourceSchema[];

    (useAppSelector as any).mockReturnValue(mockResources);
    mockUseMatches.mockReturnValue([
      { pathname: '/', params: {} },
      { pathname: '/publishers/pub1/books/book2', params: { publisherId: 'pub1', resourceId: 'book2' } },
    ]);

    render(
      <BrowserRouter>
        <AppBreadcrumb />
      </BrowserRouter>
    );

    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('book Info')).toBeInTheDocument();

    // Home should be a link
    expect(screen.getByRole('link', { name: 'Home' })).toHaveAttribute('href', '/');

    // book Info is the last item, so it should NOT be a link
    const bookInfoElement = screen.getByText('book Info');
    expect(bookInfoElement.tagName).toBe('SPAN');
  });

  it('should work with real OpenAPI schema and nested resources', async () => {
    const fileContents = fs.readFileSync('src/example_oas.json', 'utf8');
    const openAPI = await parseOpenAPI(fileContents);
    const resources = openAPI.resources();

    (useAppSelector as any).mockReturnValue(resources);
    mockUseMatches.mockReturnValue([
      { pathname: '/', params: {} },
      { pathname: '/publishers', params: {} },
      { pathname: '/publishers/pub-123', params: { resourceId: 'pub-123' } },
    ]);

    render(
      <BrowserRouter>
        <AppBreadcrumb />
      </BrowserRouter>
    );

    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Publishers')).toBeInTheDocument();
    expect(screen.getByText('publisher Info')).toBeInTheDocument();

    // Home and Publishers should be links
    expect(screen.getByRole('link', { name: 'Home' })).toHaveAttribute('href', '/');
    expect(screen.getByRole('link', { name: 'Publishers' })).toHaveAttribute('href', '/publishers');

    // publisher Info is the last item, so it should NOT be a link
    const publisherInfoElement = screen.getByText('publisher Info');
    expect(publisherInfoElement.tagName).toBe('SPAN');
    expect(publisherInfoElement).toHaveAttribute('aria-current', 'page');
  });

  it('should handle empty params object', () => {
    const mockResources = [
      {
        plural_name: 'books',
        singular_name: 'book',
        base_url: () => '/books',
      },
    ] as unknown as ResourceSchema[];

    (useAppSelector as any).mockReturnValue(mockResources);
    mockUseMatches.mockReturnValue([
      { pathname: '/books', params: {} },
    ]);

    render(
      <BrowserRouter>
        <AppBreadcrumb />
      </BrowserRouter>
    );

    expect(screen.getByText('Books')).toBeInTheDocument();
  });

  it('should handle undefined param values gracefully', () => {
    const mockResources = [
      {
        plural_name: 'books',
        singular_name: 'book',
        base_url: () => '/books',
      },
    ] as unknown as ResourceSchema[];

    (useAppSelector as any).mockReturnValue(mockResources);
    mockUseMatches.mockReturnValue([
      { pathname: '/books', params: { someParam: undefined } },
    ]);

    render(
      <BrowserRouter>
        <AppBreadcrumb />
      </BrowserRouter>
    );

    expect(screen.getByText('Books')).toBeInTheDocument();
  });
});
