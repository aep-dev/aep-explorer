import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import { Form } from './form';
import { ResourceSchema, PropertySchema } from '@/state/openapi';
import fs from 'fs';
import { parseOpenAPI } from '@/state/openapi';

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

describe('Form', () => {
  const mockOnSuccess = vi.fn();
  const mockOnError = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderForm = (resource: ResourceSchema, headers = '', parentParams = new Map<string, string>()) => {
    return render(
      <BrowserRouter>
        <Form
          resource={resource}
          headers={headers}
          parentParams={parentParams}
          onSuccess={mockOnSuccess}
          onError={mockOnError}
        />
      </BrowserRouter>
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

    expect(screen.getByRole('status', { name: 'Loading' })).toBeInTheDocument();
  });

  it('sets parent parameters on the resource', () => {
    const properties = [new PropertySchema('name', 'string')];
    const resource = createMockResourceSchema(properties);

    const parentParams = new Map<string, string>();
    parentParams.set('parentId', '123');
    parentParams.set('categoryId', '789');

    renderForm(resource, '', parentParams);

    // Check that parent parameters are set correctly on the resource
    expect(resource.parents.get('parentId')).toBe('123');
    expect(resource.parents.get('categoryId')).toBe('789');
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

  it('calls onSuccess after successful form submission', async () => {
    const properties = [new PropertySchema('name', 'string')];
    const resource = createMockResourceSchema(properties);
    renderForm(resource);

    // Fill and submit the form
    fireEvent.change(screen.getByLabelText('name'), { target: { value: 'Test Name' } });
    fireEvent.click(screen.getByRole('button', { name: 'Submit' }));

    await waitFor(() => {
      expect(mockOnSuccess).toHaveBeenCalled();
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

    // Should call onError and not onSuccess when creation fails
    await waitFor(() => {
      expect(mockOnError).toHaveBeenCalled();
    });
    expect(mockOnSuccess).not.toHaveBeenCalled();
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

  describe('Field component integration', () => {
    it('renders fields using Field component with proper structure', () => {
      const properties = [new PropertySchema('name', 'string')];
      const resource = createMockResourceSchema(properties);
      const { container } = renderForm(resource);

      // Check that Field wrapper exists
      const fieldWrapper = container.querySelector('[data-slot="field"]');
      expect(fieldWrapper).toBeInTheDocument();
      expect(fieldWrapper).toHaveAttribute('role', 'group');
    });

    it('renders FieldGroup wrapper around all fields', () => {
      const properties = [
        new PropertySchema('name', 'string'),
        new PropertySchema('age', 'integer')
      ];
      const resource = createMockResourceSchema(properties);
      const { container } = renderForm(resource);

      // Check that FieldGroup wrapper exists
      const fieldGroup = container.querySelector('[data-slot="field-group"]');
      expect(fieldGroup).toBeInTheDocument();

      // Check that multiple fields exist within the field group
      const fields = fieldGroup?.querySelectorAll('[data-slot="field"]');
      expect(fields?.length).toBe(2);
    });

    it('sets data-invalid attribute on Field when validation fails', async () => {
      const properties = [new PropertySchema('age', 'integer')];
      const resource = createMockResourceSchema(properties, false, ['age']);
      const { container } = renderForm(resource);

      const submitButton = screen.getByRole('button', { name: 'Submit' });

      // Submit with invalid value
      fireEvent.change(screen.getByLabelText('age'), { target: { value: 'not a number' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        const fieldWrapper = container.querySelector('[data-slot="field"]');
        expect(fieldWrapper).toHaveAttribute('data-invalid', 'true');
      });
    });

    it('sets aria-invalid on input when validation fails', async () => {
      const properties = [new PropertySchema('name', 'string')];
      const resource = createMockResourceSchema(properties, false, ['name']);
      renderForm(resource);

      const submitButton = screen.getByRole('button', { name: 'Submit' });
      const nameInput = screen.getByLabelText('name');

      // Submit without entering a value
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(nameInput).toHaveAttribute('aria-invalid', 'true');
      });
    });

    it('renders FieldError when validation fails', async () => {
      const properties = [new PropertySchema('name', 'string')];
      const resource = createMockResourceSchema(properties, false, ['name']);
      const { container } = renderForm(resource);

      const submitButton = screen.getByRole('button', { name: 'Submit' });

      // Submit without entering a value
      fireEvent.click(submitButton);

      await waitFor(() => {
        const fieldError = container.querySelector('[data-slot="field-error"]');
        expect(fieldError).toBeInTheDocument();
        expect(fieldError).toHaveAttribute('role', 'alert');
      });
    });

    it('properly associates labels with inputs using htmlFor', () => {
      const properties = [new PropertySchema('email', 'string')];
      const resource = createMockResourceSchema(properties);
      renderForm(resource);

      const label = screen.getByText('email');
      const input = screen.getByLabelText('email');

      expect(label).toHaveAttribute('for', input.id);
      expect(input).toHaveAttribute('id');
    });
  });

  describe('Nested object rendering', () => {
    it('renders nested objects in FieldSet with FieldLegend', () => {
      const addressSchema = {
        type: 'object',
        properties: {
          street: { type: 'string' },
          city: { type: 'string' }
        },
        required: []
      };

      const addressProperty = new PropertySchema('address', 'object', addressSchema);
      const properties = [
        new PropertySchema('name', 'string'),
        addressProperty
      ];

      const resource = createMockResourceSchema(properties);
      const { container } = renderForm(resource);

      // Check that FieldSet exists for nested object
      const fieldSet = container.querySelector('[data-slot="field-set"]');
      expect(fieldSet).toBeInTheDocument();
      expect(fieldSet?.tagName).toBe('FIELDSET');

      // Check that FieldLegend exists with the property name
      const legend = container.querySelector('[data-slot="field-legend"]');
      expect(legend).toBeInTheDocument();
      expect(legend?.tagName).toBe('LEGEND');
      expect(legend?.textContent).toBe('address');
    });

    it('renders nested object properties as separate fields', () => {
      const addressSchema = {
        type: 'object',
        properties: {
          street: { type: 'string' },
          city: { type: 'string' },
          zipCode: { type: 'string' }
        },
        required: []
      };

      const addressProperty = new PropertySchema('address', 'object', addressSchema);
      const properties = [addressProperty];

      const resource = createMockResourceSchema(properties);
      renderForm(resource);

      // Check that nested fields are rendered
      expect(screen.getByLabelText('street')).toBeInTheDocument();
      expect(screen.getByLabelText('city')).toBeInTheDocument();
      expect(screen.getByLabelText('zipCode')).toBeInTheDocument();
    });

    it('submits nested object data with correct structure', async () => {
      const addressSchema = {
        type: 'object',
        properties: {
          street: { type: 'string' },
          city: { type: 'string' }
        },
        required: []
      };

      const addressProperty = new PropertySchema('address', 'object', addressSchema);
      const properties = [
        new PropertySchema('name', 'string'),
        addressProperty
      ];

      const resource = createMockResourceSchema(properties);
      renderForm(resource);

      // Fill in both top-level and nested fields
      fireEvent.change(screen.getByLabelText('name'), { target: { value: 'John Doe' } });
      fireEvent.change(screen.getByLabelText('street'), { target: { value: '123 Main St' } });
      fireEvent.change(screen.getByLabelText('city'), { target: { value: 'Springfield' } });

      // Submit the form
      fireEvent.click(screen.getByRole('button', { name: 'Submit' }));

      await waitFor(() => {
        expect(resource.create).toHaveBeenCalledWith(
          {
            name: 'John Doe',
            address: {
              street: '123 Main St',
              city: 'Springfield'
            }
          },
          ''
        );
      });
    });

    it('validates required fields in nested objects', async () => {
      const addressSchema = {
        type: 'object',
        properties: {
          street: { type: 'string' },
          city: { type: 'string' }
        },
        required: ['street']
      };

      const addressProperty = new PropertySchema('address', 'object', addressSchema);
      const properties = [addressProperty];

      const resource = createMockResourceSchema(properties, false, ['address']);
      renderForm(resource);

      const submitButton = screen.getByRole('button', { name: 'Submit' });

      // Submit without filling required nested field
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Required')).toBeInTheDocument();
      });
    });

    it('creates nested FieldGroup for nested object properties', () => {
      const addressSchema = {
        type: 'object',
        properties: {
          street: { type: 'string' },
          city: { type: 'string' }
        },
        required: []
      };

      const addressProperty = new PropertySchema('address', 'object', addressSchema);
      const properties = [addressProperty];

      const resource = createMockResourceSchema(properties);
      const { container } = renderForm(resource);

      // Check that there are multiple FieldGroups (one main, one for nested)
      const fieldGroups = container.querySelectorAll('[data-slot="field-group"]');
      expect(fieldGroups.length).toBeGreaterThanOrEqual(2);

      // Check that nested FieldGroup is inside FieldSet
      const fieldSet = container.querySelector('[data-slot="field-set"]');
      const nestedFieldGroup = fieldSet?.querySelector('[data-slot="field-group"]');
      expect(nestedFieldGroup).toBeInTheDocument();
    });
  });
});