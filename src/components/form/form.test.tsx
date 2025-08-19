import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import CreateForm from './form';
import { ResourceSchema, PropertySchema } from '@/state/openapi';
import fs from 'fs';
import { parseOpenAPI } from '@/state/openapi';
import { toast } from '@/hooks/use-toast';

// Mock hooks
vi.mock('@/hooks/use-toast', () => ({
  toast: vi.fn(),
}));

const mockNavigate = vi.fn();
let mockParams = {};

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
      schema: (state = { value: null, state: 'unset' }) => state,
      headers: (state = { value: headers }) => state,
    },
  });
};

// Mock ResourceSchema for testing different property types
const createMockResourceSchema = (properties: PropertySchema[], shouldFail = false, requiredFields: string[] = []): ResourceSchema => {
  const mockSchema = {
    properties: () => properties,
    required: () => requiredFields,
    create: shouldFail 
      ? vi.fn().mockRejectedValue(new Error('Creation failed'))
      : vi.fn().mockResolvedValue({}),
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
    const resource = createMockResourceSchema(properties, false, ['age']); // Make age required
    renderForm(resource);

    const ageInput = screen.getByLabelText('age');
    const submitButton = screen.getByRole('button', { name: 'Submit' });

    // Enter invalid value (non-integer)
    fireEvent.change(ageInput, { target: { value: 'not a number' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Expected number, received nan')).toBeInTheDocument();
    });
  });

  it('validates number fields', async () => {
    const properties = [new PropertySchema('price', 'number')];
    const resource = createMockResourceSchema(properties, false, ['price']); // Make price required
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
    const resource = createMockResourceSchema(properties, false, ['name']); // Mark name as required
    renderForm(resource);

    const submitButton = screen.getByRole('button', { name: 'Submit' });

    // Submit without entering a value
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Required')).toBeInTheDocument();
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

  it('sets parent parameters from URL params excluding resourceId', () => {
    const properties = [new PropertySchema('name', 'string')];
    const resource = createMockResourceSchema(properties);
    
    // Temporarily mock useParams to return specific parameters
    const originalMockParams = { ...mockParams };
    mockParams = {
      parentId: '123',
      resourceId: '456',
      categoryId: '789'
    };
    
    renderForm(resource);
    
    // Check that parent parameters are set correctly (excluding resourceId)
    expect(resource.parents.get('parentId')).toBe('123');
    expect(resource.parents.get('categoryId')).toBe('789');
    expect(resource.parents.has('resourceId')).toBe(false);
    
    // Restore original mockParams
    mockParams = originalMockParams;
  });

  it('handles checkbox checked property correctly', () => {
    const properties = [new PropertySchema('active', 'boolean')];
    const resource = createMockResourceSchema(properties);
    renderForm(resource);

    const checkboxInput = screen.getByLabelText('active');
    
    // Initially unchecked
    expect(checkboxInput).not.toBeChecked();
    
    // Click to check it
    fireEvent.click(checkboxInput);
    expect(checkboxInput).toBeChecked();
    
    // Click again to uncheck
    fireEvent.click(checkboxInput);
    expect(checkboxInput).not.toBeChecked();
  });

  it('navigates back after successful form submission', async () => {
    const properties = [new PropertySchema('name', 'string')];
    const resource = createMockResourceSchema(properties);
    renderForm(resource);

    // Fill and submit the form
    fireEvent.change(screen.getByLabelText('name'), { target: { value: 'Test Name' } });
    fireEvent.click(screen.getByRole('button', { name: 'Submit' }));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith(-1);
    });
  });

  it('shows toast notification on successful form submission', async () => {
    const properties = [new PropertySchema('name', 'string')];
    const resource = createMockResourceSchema(properties);
    renderForm(resource);

    // Fill and submit the form
    fireEvent.change(screen.getByLabelText('name'), { target: { value: 'Test Name' } });
    fireEvent.click(screen.getByRole('button', { name: 'Submit' }));

    await waitFor(() => {
      expect(toast).toHaveBeenCalledWith({
        description: 'Created new resource'
      });
    });
  });

  it('handles form submission errors gracefully', async () => {
    const properties = [new PropertySchema('name', 'string')];
    const resource = createMockResourceSchema(properties, true); // Should fail
    renderForm(resource);

    // Fill and submit the form
    fireEvent.change(screen.getByLabelText('name'), { target: { value: 'Test Name' } });
    fireEvent.click(screen.getByRole('button', { name: 'Submit' }));

    await waitFor(() => {
      expect(resource.create).toHaveBeenCalled();
    });

    // Should not navigate or show success toast when creation fails
    expect(mockNavigate).not.toHaveBeenCalled();
    expect(toast).not.toHaveBeenCalled();
  });

  it('allows submission of optional string fields when empty', async () => {
    const properties = [
      new PropertySchema('requiredField', 'string'),
      new PropertySchema('optionalField', 'string')
    ];
    const resource = createMockResourceSchema(properties, false, ['requiredField']); // Only requiredField is required
    renderForm(resource);

    // Fill only the required field, leave optional field empty
    fireEvent.change(screen.getByLabelText('requiredField'), { target: { value: 'Required Value' } });
    fireEvent.click(screen.getByRole('button', { name: 'Submit' }));

    await waitFor(() => {
      expect(resource.create).toHaveBeenCalledWith(
        {
          requiredField: 'Required Value',
        },
        ''
      );
    });
  });

  it('validates only required fields and allows optional fields to be empty', async () => {
    const properties = [
      new PropertySchema('requiredField', 'string'),
      new PropertySchema('optionalField', 'string')
    ];
    const resource = createMockResourceSchema(properties, false, ['requiredField']); // Only requiredField is required
    renderForm(resource);

    const submitButton = screen.getByRole('button', { name: 'Submit' });

    // Submit without filling any fields
    fireEvent.click(submitButton);

    // Should show validation error only for required field
    await waitFor(() => {
      expect(screen.getByText('Required')).toBeInTheDocument();
    });

    // Should not show error for optional field
    expect(screen.queryByText('optionalField is required')).not.toBeInTheDocument();
  });

  it('allows optional numeric fields to be empty', async () => {
    const properties = [
      new PropertySchema('requiredName', 'string'),
      new PropertySchema('optionalAge', 'integer'),
      new PropertySchema('optionalPrice', 'number')
    ];
    const resource = createMockResourceSchema(properties, false, ['requiredName']); // Only requiredName is required
    renderForm(resource);

    // Fill only the required field
    fireEvent.change(screen.getByLabelText('requiredName'), { target: { value: 'Test Name' } });
    fireEvent.click(screen.getByRole('button', { name: 'Submit' }));

    await waitFor(() => {
      expect(resource.create).toHaveBeenCalledWith(
        {
          requiredName: 'Test Name',
        },
        ''
      );
    });
  });

  it('allows optional boolean fields to be unchecked', async () => {
    const properties = [
      new PropertySchema('requiredName', 'string'),
      new PropertySchema('optionalActive', 'boolean')
    ];
    const resource = createMockResourceSchema(properties, false, ['requiredName']); // Only requiredName is required
    renderForm(resource);

    // Fill only the required field, leave boolean unchecked
    fireEvent.change(screen.getByLabelText('requiredName'), { target: { value: 'Test Name' } });
    fireEvent.click(screen.getByRole('button', { name: 'Submit' }));

    await waitFor(() => {
      expect(resource.create).toHaveBeenCalledWith(
        {
          requiredName: 'Test Name',
        },
        ''
      );
    });
  });
});