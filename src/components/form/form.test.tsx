import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import CreateForm from './form';
import { ResourceSchema, PropertySchema } from '@/state/openapi';
import fs from 'fs';
import { parseOpenAPI } from '@/state/openapi';

// Mock hooks
vi.mock('@/hooks/use-toast', () => ({
  toast: vi.fn(),
}));

const mockNavigate = vi.fn();
const mockParams = {};

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useParams: () => mockParams,
  };
});

// Create a test store
const createTestStore = (headers = '') => {
  return configureStore({
    reducer: {
      app: (state = { headers }) => state,
    },
  });
};

// Mock ResourceSchema for testing different property types
const createMockResourceSchema = (properties: PropertySchema[]): ResourceSchema => {
  const mockSchema = {
    properties: () => properties,
    create: vi.fn().mockResolvedValue({}),
    parents: new Map(),
  } as unknown as ResourceSchema;
  
  return mockSchema;
};

describe('CreateForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderForm = (resource: ResourceSchema, headers = '') => {
    const store = createTestStore(headers);
    
    return render(
      <Provider store={store}>
        <BrowserRouter>
          <CreateForm resource={resource} />
        </BrowserRouter>
      </Provider>
    );
  };

  it('renders form fields based on resource properties', () => {
    const properties = [
      new PropertySchema('name', 'string'),
      new PropertySchema('age', 'integer'),
      new PropertySchema('price', 'number'),
      new PropertySchema('active', 'boolean'),
    ];
    
    const resource = createMockResourceSchema(properties);
    renderForm(resource);

    expect(screen.getByLabelText('name')).toBeInTheDocument();
    expect(screen.getByLabelText('age')).toBeInTheDocument();
    expect(screen.getByLabelText('price')).toBeInTheDocument();
    expect(screen.getByLabelText('active')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Submit' })).toBeInTheDocument();
  });

  it('sets correct input types for different property types', () => {
    const properties = [
      new PropertySchema('name', 'string'),
      new PropertySchema('age', 'integer'),
      new PropertySchema('price', 'number'),
      new PropertySchema('active', 'boolean'),
    ];
    
    const resource = createMockResourceSchema(properties);
    renderForm(resource);

    const nameInput = screen.getByLabelText('name');
    const ageInput = screen.getByLabelText('age');
    const priceInput = screen.getByLabelText('price');
    const activeInput = screen.getByLabelText('active');

    expect(nameInput).toHaveAttribute('type', 'text');
    expect(ageInput).toHaveAttribute('type', 'number');
    expect(priceInput).toHaveAttribute('type', 'number');
    expect(activeInput).toHaveAttribute('type', 'checkbox');
  });

  it('validates integer fields', async () => {
    const properties = [new PropertySchema('age', 'integer')];
    const resource = createMockResourceSchema(properties);
    renderForm(resource);

    const ageInput = screen.getByLabelText('age');
    const submitButton = screen.getByRole('button', { name: 'Submit' });

    // Enter invalid value (non-integer)
    fireEvent.change(ageInput, { target: { value: 'not a number' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('age must be an integer')).toBeInTheDocument();
    });
  });

  it('validates number fields', async () => {
    const properties = [new PropertySchema('price', 'number')];
    const resource = createMockResourceSchema(properties);
    renderForm(resource);

    const priceInput = screen.getByLabelText('price');
    const submitButton = screen.getByRole('button', { name: 'Submit' });

    // Enter invalid value
    fireEvent.change(priceInput, { target: { value: 'not a number' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('price must be a number')).toBeInTheDocument();
    });
  });

  it('validates required string fields', async () => {
    const properties = [new PropertySchema('name', 'string')];
    const resource = createMockResourceSchema(properties);
    renderForm(resource);

    const submitButton = screen.getByRole('button', { name: 'Submit' });

    // Submit without entering a value
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('name is required')).toBeInTheDocument();
    });
  });

  it('submits form with valid data', async () => {
    const properties = [
      new PropertySchema('name', 'string'),
      new PropertySchema('age', 'integer'),
      new PropertySchema('active', 'boolean'),
    ];
    
    const resource = createMockResourceSchema(properties);
    renderForm(resource);

    // Fill in the form
    fireEvent.change(screen.getByLabelText('name'), { target: { value: 'John Doe' } });
    fireEvent.change(screen.getByLabelText('age'), { target: { value: '25' } });
    fireEvent.click(screen.getByLabelText('active'));

    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: 'Submit' }));

    await waitFor(() => {
      expect(resource.create).toHaveBeenCalledWith(
        {
          name: 'John Doe',
          age: 25,
          active: true,
        },
        ''
      );
    });
  });

  it('works with real OpenAPI schema', () => {
    const fileContents = fs.readFileSync('src/example_oas.json', 'utf8');
    const openAPI = parseOpenAPI(fileContents);
    const bookResource = openAPI.resourceForName('books');
    
    renderForm(bookResource);

    // Check that some expected fields are rendered
    expect(screen.getByLabelText('edition')).toBeInTheDocument();
    expect(screen.getByLabelText('price')).toBeInTheDocument();
    expect(screen.getByLabelText('published')).toBeInTheDocument();
    
    // Check input types
    expect(screen.getByLabelText('edition')).toHaveAttribute('type', 'number');
    expect(screen.getByLabelText('price')).toHaveAttribute('type', 'number');
    expect(screen.getByLabelText('published')).toHaveAttribute('type', 'checkbox');
  });

  it('handles loading state when properties are null', () => {
    const properties = [null as any];
    const resource = createMockResourceSchema(properties);
    renderForm(resource);

    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });
});