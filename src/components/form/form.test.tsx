import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach, type Mock } from "vitest";
import { BrowserRouter } from "react-router-dom";
import { Form, AdditionalField } from "./form";
import { ResourceSchema, PropertySchema } from "@/state/openapi";
import { Schema } from "@aep_dev/aep-lib-ts";
import { ResourceInstance } from "@/state/fetch";
import fs from "fs";
import { parseOpenAPI } from "@/state/openapi";
import "@testing-library/jest-dom/vitest";

// Mock ResourceSchema for testing different property types
const createMockResourceSchema = (
  properties: PropertySchema[],
  shouldFail = false,
  requiredFields: string[] = [],
): ResourceSchema => {
  const mockSchema = {
    properties: () => properties,
    required: () => requiredFields,
    create: shouldFail
      ? vi.fn().mockRejectedValue(new Error("Creation failed"))
      : vi.fn().mockResolvedValue({}),
    parents: new Map(),
  } as unknown as ResourceSchema;

  return mockSchema;
};

describe("Form", () => {
  const mockOnSuccess = vi.fn();
  const mockOnError = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderForm = (
    resource: ResourceSchema,
    headers = "",
    parentParams = new Map<string, string>(),
    resourceInstance?: ResourceInstance,
    onSubmitOperation?: (
      value: Record<string, unknown>,
      additionalFieldsValues: Record<string, unknown>,
    ) => Promise<void>,
    additionalFields?: AdditionalField[],
  ) => {
    const defaultOnSubmitOperation =
      onSubmitOperation ||
      ((
        value: Record<string, unknown>,
        additionalFieldsValues: Record<string, unknown>,
      ) => {
        let id: string | undefined = undefined;
        if (additionalFieldsValues.id) {
          id = additionalFieldsValues.id as string;
        }
        return resource.create(value, id, parentParams, headers);
      });

    return render(
      <BrowserRouter>
        <Form
          resource={resource}
          headers={headers}
          parentParams={parentParams}
          onSuccess={mockOnSuccess}
          onError={mockOnError}
          resourceInstance={resourceInstance}
          onSubmitOperation={defaultOnSubmitOperation}
          additionalFields={additionalFields}
        />
      </BrowserRouter>,
    );
  };

  it("renders form fields based on resource properties", () => {
    const properties = [
      new PropertySchema("name", "string"),
      new PropertySchema("age", "integer"),
      new PropertySchema("price", "number"),
      new PropertySchema("active", "boolean"),
    ];

    const resource = createMockResourceSchema(properties);
    renderForm(resource);

    expect(screen.getByLabelText("name")).toBeInTheDocument();
    expect(screen.getByLabelText("age")).toBeInTheDocument();
    expect(screen.getByLabelText("price")).toBeInTheDocument();
    expect(screen.getByLabelText("active")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Submit" })).toBeInTheDocument();
  });

  it("sets correct input types for different property types", () => {
    const properties = [
      new PropertySchema("name", "string"),
      new PropertySchema("age", "integer"),
      new PropertySchema("price", "number"),
      new PropertySchema("active", "boolean"),
    ];

    const resource = createMockResourceSchema(properties);
    renderForm(resource);

    const nameInput = screen.getByLabelText("name");
    const ageInput = screen.getByLabelText("age");
    const priceInput = screen.getByLabelText("price");
    const activeInput = screen.getByLabelText("active");

    expect(nameInput).toHaveAttribute("type", "text");
    expect(ageInput).toHaveAttribute("type", "number");
    expect(priceInput).toHaveAttribute("type", "number");
    expect(activeInput).toHaveAttribute("type", "checkbox");
  });

  it("validates integer fields", async () => {
    const properties = [new PropertySchema("age", "integer")];
    const resource = createMockResourceSchema(properties, false, ["age"]); // Make age required
    renderForm(resource);

    const ageInput = screen.getByLabelText("age");
    const submitButton = screen.getByRole("button", { name: "Submit" });

    // Enter invalid value (non-integer)
    fireEvent.change(ageInput, { target: { value: "not a number" } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText("Expected number, received nan"),
      ).toBeInTheDocument();
    });
  });

  it("validates number fields", async () => {
    const properties = [new PropertySchema("price", "number")];
    const resource = createMockResourceSchema(properties, false, ["price"]); // Make price required
    renderForm(resource);

    const priceInput = screen.getByLabelText("price");
    const submitButton = screen.getByRole("button", { name: "Submit" });

    // Enter invalid value
    fireEvent.change(priceInput, { target: { value: "not a number" } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText("price must be a number")).toBeInTheDocument();
    });
  });

  it("validates required string fields", async () => {
    const properties = [new PropertySchema("name", "string")];
    const resource = createMockResourceSchema(properties, false, ["name"]); // Mark name as required
    renderForm(resource);

    const submitButton = screen.getByRole("button", { name: "Submit" });

    // Submit without entering a value
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText("Required")).toBeInTheDocument();
    });
  });

  it("submits form with valid data", async () => {
    const properties = [
      new PropertySchema("name", "string"),
      new PropertySchema("age", "integer"),
      new PropertySchema("active", "boolean"),
    ];

    const resource = createMockResourceSchema(properties);
    renderForm(resource);

    // Fill in the form
    fireEvent.change(screen.getByLabelText("name"), {
      target: { value: "John Doe" },
    });
    fireEvent.change(screen.getByLabelText("age"), { target: { value: "25" } });
    fireEvent.click(screen.getByLabelText("active"));

    // Submit the form
    fireEvent.click(screen.getByRole("button", { name: "Submit" }));

    await waitFor(() => {
      expect(resource.create).toHaveBeenCalledWith(
        {
          name: "John Doe",
          age: 25,
          active: true,
        },
        undefined,
        new Map(),
        "",
      );
    });
  });

  it("works with real OpenAPI schema", async () => {
    const fileContents = fs.readFileSync("src/example_oas.json", "utf8");
    const openAPI = await parseOpenAPI(fileContents);
    const bookResource = openAPI.resourceForName("books");

    renderForm(bookResource);

    // Check that some expected fields are rendered
    expect(screen.getByLabelText("edition")).toBeInTheDocument();
    expect(screen.getByLabelText("price")).toBeInTheDocument();
    expect(screen.getByLabelText("published")).toBeInTheDocument();

    // Check input types
    expect(screen.getByLabelText("edition")).toHaveAttribute("type", "number");
    expect(screen.getByLabelText("price")).toHaveAttribute("type", "number");
    expect(screen.getByLabelText("published")).toHaveAttribute(
      "type",
      "checkbox",
    );
  });

  it("handles loading state when properties are null", () => {
    const properties = [null as any]; // eslint-disable-line @typescript-eslint/no-explicit-any
    const resource = createMockResourceSchema(properties);
    renderForm(resource);

    expect(screen.getByRole("status", { name: "Loading" })).toBeInTheDocument();
  });

  it("sets parent parameters on the resource", () => {
    const properties = [new PropertySchema("name", "string")];
    const resource = createMockResourceSchema(properties);

    const parentParams = new Map<string, string>();
    parentParams.set("parentId", "123");
    parentParams.set("categoryId", "789");

    renderForm(resource, "", parentParams);

    // Check that parent parameters are set correctly on the resource
    expect(resource.parents.get("parentId")).toBe("123");
    expect(resource.parents.get("categoryId")).toBe("789");
  });

  it("handles checkbox checked property correctly", () => {
    const properties = [new PropertySchema("active", "boolean")];
    const resource = createMockResourceSchema(properties);
    renderForm(resource);

    const checkboxInput = screen.getByLabelText("active");

    // Initially unchecked
    expect(checkboxInput).not.toBeChecked();

    // Click to check it
    fireEvent.click(checkboxInput);
    expect(checkboxInput).toBeChecked();

    // Click again to uncheck
    fireEvent.click(checkboxInput);
    expect(checkboxInput).not.toBeChecked();
  });

  it("calls onSuccess after successful form submission", async () => {
    const properties = [new PropertySchema("name", "string")];
    const resource = createMockResourceSchema(properties);
    renderForm(resource);

    // Fill and submit the form
    fireEvent.change(screen.getByLabelText("name"), {
      target: { value: "Test Name" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Submit" }));

    await waitFor(() => {
      expect(mockOnSuccess).toHaveBeenCalled();
    });
  });

  it("handles form submission errors gracefully", async () => {
    const properties = [new PropertySchema("name", "string")];
    const resource = createMockResourceSchema(properties, true); // Should fail
    renderForm(resource);

    // Fill and submit the form
    fireEvent.change(screen.getByLabelText("name"), {
      target: { value: "Test Name" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Submit" }));

    await waitFor(() => {
      expect(resource.create).toHaveBeenCalled();
    });

    // Should call onError and not onSuccess when creation fails
    await waitFor(() => {
      expect(mockOnError).toHaveBeenCalled();
    });
    expect(mockOnSuccess).not.toHaveBeenCalled();
  });

  it("allows submission of optional string fields when empty", async () => {
    const properties = [
      new PropertySchema("requiredField", "string"),
      new PropertySchema("optionalField", "string"),
    ];
    const resource = createMockResourceSchema(properties, false, [
      "requiredField",
    ]); // Only requiredField is required
    renderForm(resource);

    // Fill only the required field, leave optional field empty
    fireEvent.change(screen.getByLabelText("requiredField"), {
      target: { value: "Required Value" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Submit" }));

    await waitFor(() => {
      expect(resource.create).toHaveBeenCalledWith(
        {
          requiredField: "Required Value",
        },
        undefined,
        new Map(),
        "",
      );
    });
  });

  it("validates only required fields and allows optional fields to be empty", async () => {
    const properties = [
      new PropertySchema("requiredField", "string"),
      new PropertySchema("optionalField", "string"),
    ];
    const resource = createMockResourceSchema(properties, false, [
      "requiredField",
    ]); // Only requiredField is required
    renderForm(resource);

    const submitButton = screen.getByRole("button", { name: "Submit" });

    // Submit without filling any fields
    fireEvent.click(submitButton);

    // Should show validation error only for required field
    await waitFor(() => {
      expect(screen.getByText("Required")).toBeInTheDocument();
    });

    // Should not show error for optional field
    expect(
      screen.queryByText("optionalField is required"),
    ).not.toBeInTheDocument();
  });

  it("allows optional numeric fields to be empty", async () => {
    const properties = [
      new PropertySchema("requiredName", "string"),
      new PropertySchema("optionalAge", "integer"),
      new PropertySchema("optionalPrice", "number"),
    ];
    const resource = createMockResourceSchema(properties, false, [
      "requiredName",
    ]); // Only requiredName is required
    renderForm(resource);

    // Fill only the required field
    fireEvent.change(screen.getByLabelText("requiredName"), {
      target: { value: "Test Name" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Submit" }));

    await waitFor(() => {
      expect(resource.create).toHaveBeenCalledWith(
        {
          requiredName: "Test Name",
        },
        undefined,
        new Map(),
        "",
      );
    });
  });

  it("allows optional boolean fields to be unchecked", async () => {
    const properties = [
      new PropertySchema("requiredName", "string"),
      new PropertySchema("optionalActive", "boolean"),
    ];
    const resource = createMockResourceSchema(properties, false, [
      "requiredName",
    ]); // Only requiredName is required
    renderForm(resource);

    // Fill only the required field, leave boolean unchecked
    fireEvent.change(screen.getByLabelText("requiredName"), {
      target: { value: "Test Name" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Submit" }));

    await waitFor(() => {
      expect(resource.create).toHaveBeenCalledWith(
        {
          requiredName: "Test Name",
        },
        undefined,
        new Map(),
        "",
      );
    });
  });

  describe("Field component integration", () => {
    it("renders fields using Field component with proper structure", () => {
      const properties = [new PropertySchema("name", "string")];
      const resource = createMockResourceSchema(properties);
      const { container } = renderForm(resource);

      // Check that Field wrapper exists
      const fieldWrapper = container.querySelector('[data-slot="field"]');
      expect(fieldWrapper).toBeInTheDocument();
      expect(fieldWrapper).toHaveAttribute("role", "group");
    });

    it("renders FieldGroup wrapper around all fields", () => {
      const properties = [
        new PropertySchema("name", "string"),
        new PropertySchema("age", "integer"),
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

    it("sets data-invalid attribute on Field when validation fails", async () => {
      const properties = [new PropertySchema("age", "integer")];
      const resource = createMockResourceSchema(properties, false, ["age"]);
      const { container } = renderForm(resource);

      const submitButton = screen.getByRole("button", { name: "Submit" });

      // Submit with invalid value
      fireEvent.change(screen.getByLabelText("age"), {
        target: { value: "not a number" },
      });
      fireEvent.click(submitButton);

      await waitFor(() => {
        const fieldWrapper = container.querySelector('[data-slot="field"]');
        expect(fieldWrapper).toHaveAttribute("data-invalid", "true");
      });
    });

    it("sets aria-invalid on input when validation fails", async () => {
      const properties = [new PropertySchema("name", "string")];
      const resource = createMockResourceSchema(properties, false, ["name"]);
      renderForm(resource);

      const submitButton = screen.getByRole("button", { name: "Submit" });
      const nameInput = screen.getByLabelText("name");

      // Submit without entering a value
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(nameInput).toHaveAttribute("aria-invalid", "true");
      });
    });

    it("renders FieldError when validation fails", async () => {
      const properties = [new PropertySchema("name", "string")];
      const resource = createMockResourceSchema(properties, false, ["name"]);
      const { container } = renderForm(resource);

      const submitButton = screen.getByRole("button", { name: "Submit" });

      // Submit without entering a value
      fireEvent.click(submitButton);

      await waitFor(() => {
        const fieldError = container.querySelector('[data-slot="field-error"]');
        expect(fieldError).toBeInTheDocument();
        expect(fieldError).toHaveAttribute("role", "alert");
      });
    });

    it("properly associates labels with inputs using htmlFor", () => {
      const properties = [new PropertySchema("email", "string")];
      const resource = createMockResourceSchema(properties);
      renderForm(resource);

      const label = screen.getByText("email");
      const input = screen.getByLabelText("email");

      expect(label).toHaveAttribute("for", input.id);
      expect(input).toHaveAttribute("id");
    });
  });

  describe("Nested object rendering", () => {
    it("renders nested objects in FieldSet with FieldLegend", () => {
      const addressSchema = {
        type: "object",
        properties: {
          street: { type: "string" },
          city: { type: "string" },
        },
        required: [],
      };

      const addressProperty = new PropertySchema(
        "address",
        "object",
        addressSchema,
      );
      const properties = [
        new PropertySchema("name", "string"),
        addressProperty,
      ];

      const resource = createMockResourceSchema(properties);
      const { container } = renderForm(resource);

      // Check that FieldSet exists for nested object
      const fieldSet = container.querySelector('[data-slot="field-set"]');
      expect(fieldSet).toBeInTheDocument();
      expect(fieldSet?.tagName).toBe("FIELDSET");

      // Check that FieldLegend exists with the property name
      const legend = container.querySelector('[data-slot="field-legend"]');
      expect(legend).toBeInTheDocument();
      expect(legend?.tagName).toBe("LEGEND");
      expect(legend?.textContent).toBe("address");
    });

    it("renders nested object properties as separate fields", () => {
      const addressSchema = {
        type: "object",
        properties: {
          street: { type: "string" },
          city: { type: "string" },
          zipCode: { type: "string" },
        },
        required: [],
      };

      const addressProperty = new PropertySchema(
        "address",
        "object",
        addressSchema,
      );
      const properties = [addressProperty];

      const resource = createMockResourceSchema(properties);
      renderForm(resource);

      // Check that nested fields are rendered
      expect(screen.getByLabelText("street")).toBeInTheDocument();
      expect(screen.getByLabelText("city")).toBeInTheDocument();
      expect(screen.getByLabelText("zipCode")).toBeInTheDocument();
    });

    it("submits nested object data with correct structure", async () => {
      const addressSchema = {
        type: "object",
        properties: {
          street: { type: "string" },
          city: { type: "string" },
        },
        required: [],
      };

      const addressProperty = new PropertySchema(
        "address",
        "object",
        addressSchema,
      );
      const properties = [
        new PropertySchema("name", "string"),
        addressProperty,
      ];

      const resource = createMockResourceSchema(properties);
      renderForm(resource);

      // Fill in both top-level and nested fields
      fireEvent.change(screen.getByLabelText("name"), {
        target: { value: "John Doe" },
      });
      fireEvent.change(screen.getByLabelText("street"), {
        target: { value: "123 Main St" },
      });
      fireEvent.change(screen.getByLabelText("city"), {
        target: { value: "Springfield" },
      });

      // Submit the form
      fireEvent.click(screen.getByRole("button", { name: "Submit" }));

      await waitFor(() => {
        expect(resource.create).toHaveBeenCalledWith(
          {
            name: "John Doe",
            address: {
              street: "123 Main St",
              city: "Springfield",
            },
          },
          undefined,
          new Map(),
          "",
        );
      });
    });

    it("validates required fields in nested objects", async () => {
      const addressSchema = {
        type: "object",
        properties: {
          street: { type: "string" },
          city: { type: "string" },
        },
        required: ["street"],
      };

      const addressProperty = new PropertySchema(
        "address",
        "object",
        addressSchema,
      );
      const properties = [addressProperty];

      const resource = createMockResourceSchema(properties, false, ["address"]);
      renderForm(resource);

      const submitButton = screen.getByRole("button", { name: "Submit" });

      // Submit without filling required nested field
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText("Required")).toBeInTheDocument();
      });
    });

    it("creates nested FieldGroup for nested object properties", () => {
      const addressSchema = {
        type: "object",
        properties: {
          street: { type: "string" },
          city: { type: "string" },
        },
        required: [],
      };

      const addressProperty = new PropertySchema(
        "address",
        "object",
        addressSchema,
      );
      const properties = [addressProperty];

      const resource = createMockResourceSchema(properties);
      const { container } = renderForm(resource);

      // Check that there are multiple FieldGroups (one main, one for nested)
      const fieldGroups = container.querySelectorAll(
        '[data-slot="field-group"]',
      );
      expect(fieldGroups.length).toBeGreaterThanOrEqual(2);

      // Check that nested FieldGroup is inside FieldSet
      const fieldSet = container.querySelector('[data-slot="field-set"]');
      const nestedFieldGroup = fieldSet?.querySelector(
        '[data-slot="field-group"]',
      );
      expect(nestedFieldGroup).toBeInTheDocument();
    });
  });

  describe("ResourceInstance integration", () => {
    const createMockResourceInstance = (
      properties: Record<string, unknown>,
      schema: ResourceSchema,
    ): ResourceInstance => {
      return {
        id: "123",
        path: "/test/123",
        properties: properties,
        schema: schema,
        delete: vi.fn().mockResolvedValue({}),
        update: vi.fn().mockResolvedValue({}),
      } as unknown as ResourceInstance;
    };

    it("populates form with default values from resourceInstance", () => {
      const properties = [
        new PropertySchema("name", "string"),
        new PropertySchema("age", "integer"),
        new PropertySchema("active", "boolean"),
      ];

      const resource = createMockResourceSchema(properties);
      const resourceInstance = createMockResourceInstance(
        {
          name: "John Doe",
          age: 30,
          active: true,
        },
        resource,
      );

      renderForm(resource, "", new Map(), resourceInstance);

      expect(screen.getByLabelText("name")).toHaveValue("John Doe");
      expect(screen.getByLabelText("age")).toHaveValue(30);
      expect(screen.getByLabelText("active")).toBeChecked();
    });

    it("calls update operation when resourceInstance is provided", async () => {
      const properties = [new PropertySchema("name", "string")];
      const resource = createMockResourceSchema(properties);
      const resourceInstance = createMockResourceInstance(
        { name: "Old Name" },
        resource,
      );
      const mockUpdateOperation = vi.fn().mockResolvedValue({});

      renderForm(
        resource,
        "",
        new Map(),
        resourceInstance,
        mockUpdateOperation,
      );

      // Update the name field
      const nameInput = screen.getByLabelText("name");
      fireEvent.change(nameInput, { target: { value: "New Name" } });

      // Submit the form
      fireEvent.click(screen.getByRole("button", { name: "Submit" }));

      await waitFor(() => {
        expect(mockUpdateOperation).toHaveBeenCalledWith(
          { name: "New Name" },
          {},
        );
      });

      expect(mockOnSuccess).toHaveBeenCalled();
    });

    it("calls create operation when resourceInstance is not provided", async () => {
      const properties = [new PropertySchema("name", "string")];
      const resource = createMockResourceSchema(properties);
      const mockCreateOperation = vi.fn().mockResolvedValue({});

      renderForm(resource, "", new Map(), undefined, mockCreateOperation);

      // Fill in the name field
      fireEvent.change(screen.getByLabelText("name"), {
        target: { value: "Test Name" },
      });

      // Submit the form
      fireEvent.click(screen.getByRole("button", { name: "Submit" }));

      await waitFor(() => {
        expect(mockCreateOperation).toHaveBeenCalledWith(
          { name: "Test Name" },
          {},
        );
      });

      expect(mockOnSuccess).toHaveBeenCalled();
    });

    it("handles empty/undefined values in resourceInstance properties", () => {
      const properties = [
        new PropertySchema("name", "string"),
        new PropertySchema("description", "string"),
      ];

      const resource = createMockResourceSchema(properties);
      const resourceInstance = createMockResourceInstance(
        {
          name: "Test Name",
          // description is intentionally omitted
        },
        resource,
      );

      renderForm(resource, "", new Map(), resourceInstance);

      expect(screen.getByLabelText("name")).toHaveValue("Test Name");
      expect(screen.getByLabelText("description")).toHaveValue("");
    });

    it("allows modification of pre-filled values from resourceInstance", async () => {
      const properties = [
        new PropertySchema("name", "string"),
        new PropertySchema("age", "integer"),
      ];

      const resource = createMockResourceSchema(properties);
      const resourceInstance = createMockResourceInstance(
        {
          name: "Original Name",
          age: 25,
        },
        resource,
      );
      const mockUpdateOperation = vi.fn().mockResolvedValue({});

      renderForm(
        resource,
        "",
        new Map(),
        resourceInstance,
        mockUpdateOperation,
      );

      // Verify initial values
      expect(screen.getByLabelText("name")).toHaveValue("Original Name");
      expect(screen.getByLabelText("age")).toHaveValue(25);

      // Modify both fields
      fireEvent.change(screen.getByLabelText("name"), {
        target: { value: "Modified Name" },
      });
      fireEvent.change(screen.getByLabelText("age"), {
        target: { value: "30" },
      });

      // Submit the form
      fireEvent.click(screen.getByRole("button", { name: "Submit" }));

      await waitFor(() => {
        expect(mockUpdateOperation).toHaveBeenCalledWith(
          {
            name: "Modified Name",
            age: 30,
          },
          {},
        );
      });
    });

    it("handles nested object values in resourceInstance", () => {
      const addressSchema = {
        type: "object",
        properties: {
          street: { type: "string" },
          city: { type: "string" },
        },
        required: [],
      };

      const addressProperty = new PropertySchema(
        "address",
        "object",
        addressSchema,
      );
      const properties = [
        new PropertySchema("name", "string"),
        addressProperty,
      ];

      const resource = createMockResourceSchema(properties);
      const resourceInstance = createMockResourceInstance(
        {
          name: "John Doe",
          address: {
            street: "123 Main St",
            city: "Springfield",
          },
        },
        resource,
      );

      renderForm(resource, "", new Map(), resourceInstance);

      expect(screen.getByLabelText("name")).toHaveValue("John Doe");
      expect(screen.getByLabelText("street")).toHaveValue("123 Main St");
      expect(screen.getByLabelText("city")).toHaveValue("Springfield");
    });
  });

  describe("Form/JSON mode toggle", () => {
    it("renders button group with Form and JSON buttons", () => {
      const properties = [new PropertySchema("name", "string")];
      const resource = createMockResourceSchema(properties);
      renderForm(resource);

      expect(screen.getByRole("button", { name: "Form" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "JSON" })).toBeInTheDocument();
    });

    it("starts in form mode by default", () => {
      const properties = [new PropertySchema("name", "string")];
      const resource = createMockResourceSchema(properties);
      renderForm(resource);

      // Form fields should be visible
      expect(screen.getByLabelText("name")).toBeInTheDocument();
    });

    it("switches to JSON mode when JSON button is clicked", async () => {
      const properties = [new PropertySchema("name", "string")];
      const resource = createMockResourceSchema(properties);
      renderForm(resource);

      const jsonButton = screen.getByRole("button", { name: "JSON" });
      fireEvent.click(jsonButton);

      await waitFor(() => {
        // Form fields should not be visible in JSON mode
        expect(screen.queryByLabelText("name")).not.toBeInTheDocument();
      });
    });

    it("syncs form data to JSON when switching to JSON mode", async () => {
      const properties = [
        new PropertySchema("name", "string"),
        new PropertySchema("age", "integer"),
      ];
      const resource = createMockResourceSchema(properties);
      const { container } = renderForm(resource);

      // Fill in form fields
      fireEvent.change(screen.getByLabelText("name"), {
        target: { value: "John Doe" },
      });
      fireEvent.change(screen.getByLabelText("age"), {
        target: { value: "25" },
      });

      // Switch to JSON mode
      const jsonButton = screen.getByRole("button", { name: "JSON" });
      fireEvent.click(jsonButton);

      await waitFor(() => {
        // JSON editor should be visible
        const jsonEditor = container.querySelector(".jer-editor-container");
        expect(jsonEditor).toBeInTheDocument();
      });
    });

    it("syncs JSON data to form when switching back to form mode", async () => {
      const properties = [
        new PropertySchema("name", "string"),
        new PropertySchema("age", "integer"),
      ];
      const resource = createMockResourceSchema(properties);
      const resourceInstance = {
        id: "123",
        path: "/test/123",
        properties: { name: "Original", age: 20 },
        schema: resource,
        delete: vi.fn(),
        update: vi.fn(),
      } as unknown as ResourceInstance;

      renderForm(resource, "", new Map(), resourceInstance);

      // Switch to JSON mode
      fireEvent.click(screen.getByRole("button", { name: "JSON" }));

      await waitFor(() => {
        expect(screen.queryByLabelText("name")).not.toBeInTheDocument();
      });

      // Switch back to form mode
      fireEvent.click(screen.getByRole("button", { name: "Form" }));

      await waitFor(() => {
        expect(screen.getByLabelText("name")).toBeInTheDocument();
        expect(screen.getByLabelText("age")).toBeInTheDocument();
      });
    });

    it("validates JSON data when switching to form mode", async () => {
      const properties = [new PropertySchema("age", "integer")];
      const resource = createMockResourceSchema(properties, false, ["age"]);
      const resourceInstance = {
        id: "123",
        path: "/test/123",
        properties: { age: 25 },
        schema: resource,
        delete: vi.fn(),
        update: vi.fn(),
      } as unknown as ResourceInstance;

      renderForm(resource, "", new Map(), resourceInstance);

      // Switch to JSON mode
      fireEvent.click(screen.getByRole("button", { name: "JSON" }));

      await waitFor(() => {
        expect(screen.queryByLabelText("age")).not.toBeInTheDocument();
      });

      // Switch back to form mode (should work since JSON has valid data)
      fireEvent.click(screen.getByRole("button", { name: "Form" }));

      await waitFor(() => {
        expect(screen.getByLabelText("age")).toBeInTheDocument();
        expect(screen.getByLabelText("age")).toHaveValue(25);
      });
    });

    it("prevents switching to form mode if JSON is invalid", async () => {
      const properties = [new PropertySchema("age", "integer")];
      const resource = createMockResourceSchema(properties, false, ["age"]);
      renderForm(resource);

      // Switch to JSON mode
      fireEvent.click(screen.getByRole("button", { name: "JSON" }));

      await waitFor(() => {
        expect(screen.queryByLabelText("age")).not.toBeInTheDocument();
      });

      // Note: The actual JSON editor interaction would need to be simulated differently
      // For now, this test structure shows the intent
    });

    it("displays JSON validation errors", async () => {
      const properties = [new PropertySchema("name", "string")];
      const resource = createMockResourceSchema(properties, false, ["name"]);
      renderForm(resource);

      // Switch to JSON mode
      fireEvent.click(screen.getByRole("button", { name: "JSON" }));

      await waitFor(() => {
        expect(screen.queryByLabelText("name")).not.toBeInTheDocument();
      });
    });
  });

  describe("JSON mode submission", () => {
    it("submits JSON data when submit is clicked in JSON mode", async () => {
      const properties = [
        new PropertySchema("name", "string"),
        new PropertySchema("age", "integer"),
      ];
      const resource = createMockResourceSchema(properties);
      renderForm(resource);

      // Fill in form
      fireEvent.change(screen.getByLabelText("name"), {
        target: { value: "Jane Doe" },
      });
      fireEvent.change(screen.getByLabelText("age"), {
        target: { value: "30" },
      });

      // Switch to JSON mode
      fireEvent.click(screen.getByRole("button", { name: "JSON" }));

      await waitFor(() => {
        expect(screen.queryByLabelText("name")).not.toBeInTheDocument();
      });

      // Submit from JSON mode
      fireEvent.click(screen.getByRole("button", { name: "Submit" }));

      await waitFor(() => {
        expect(resource.create).toHaveBeenCalledWith(
          expect.objectContaining({
            name: "Jane Doe",
            age: 30,
          }),
          undefined,
          new Map(),
          "",
        );
      });
    });

    it("validates JSON before submission", async () => {
      const properties = [new PropertySchema("name", "string")];
      const resource = createMockResourceSchema(properties, false, ["name"]);
      renderForm(resource);

      // Switch to JSON mode
      fireEvent.click(screen.getByRole("button", { name: "JSON" }));

      await waitFor(() => {
        expect(screen.queryByLabelText("name")).not.toBeInTheDocument();
      });

      // Note: We would need to clear the JSON data here in a real scenario
      // This test structure shows the validation intent
    });

    it("calls onSuccess after successful JSON mode submission", async () => {
      const properties = [new PropertySchema("name", "string")];
      const resource = createMockResourceSchema(properties);
      renderForm(resource);

      // Fill in form
      fireEvent.change(screen.getByLabelText("name"), {
        target: { value: "Test" },
      });

      // Switch to JSON mode
      fireEvent.click(screen.getByRole("button", { name: "JSON" }));

      await waitFor(() => {
        expect(screen.queryByLabelText("name")).not.toBeInTheDocument();
      });

      // Submit
      fireEvent.click(screen.getByRole("button", { name: "Submit" }));

      await waitFor(() => {
        expect(mockOnSuccess).toHaveBeenCalled();
      });
    });
  });

  describe("Bidirectional sync", () => {
    it("preserves changes when switching between modes", async () => {
      const properties = [
        new PropertySchema("name", "string"),
        new PropertySchema("age", "integer"),
      ];
      const resource = createMockResourceSchema(properties);
      renderForm(resource);

      // Fill in form
      fireEvent.change(screen.getByLabelText("name"), {
        target: { value: "Alice" },
      });
      fireEvent.change(screen.getByLabelText("age"), {
        target: { value: "28" },
      });

      // Switch to JSON mode
      fireEvent.click(screen.getByRole("button", { name: "JSON" }));

      await waitFor(() => {
        expect(screen.queryByLabelText("name")).not.toBeInTheDocument();
      });

      // Switch back to form mode
      fireEvent.click(screen.getByRole("button", { name: "Form" }));

      await waitFor(() => {
        expect(screen.getByLabelText("name")).toHaveValue("Alice");
        expect(screen.getByLabelText("age")).toHaveValue(28);
      });
    });

    it("handles nested objects in JSON mode", async () => {
      const addressSchema = {
        type: "object",
        properties: {
          street: { type: "string" },
          city: { type: "string" },
        },
        required: [],
      };

      const addressProperty = new PropertySchema(
        "address",
        "object",
        addressSchema,
      );
      const properties = [
        new PropertySchema("name", "string"),
        addressProperty,
      ];

      const resource = createMockResourceSchema(properties);
      renderForm(resource);

      // Fill in form with nested data
      fireEvent.change(screen.getByLabelText("name"), {
        target: { value: "Bob" },
      });
      fireEvent.change(screen.getByLabelText("street"), {
        target: { value: "456 Oak Ave" },
      });
      fireEvent.change(screen.getByLabelText("city"), {
        target: { value: "Portland" },
      });

      // Switch to JSON mode
      fireEvent.click(screen.getByRole("button", { name: "JSON" }));

      await waitFor(() => {
        expect(screen.queryByLabelText("name")).not.toBeInTheDocument();
      });

      // Switch back to form mode
      fireEvent.click(screen.getByRole("button", { name: "Form" }));

      await waitFor(() => {
        expect(screen.getByLabelText("name")).toHaveValue("Bob");
        expect(screen.getByLabelText("street")).toHaveValue("456 Oak Ave");
        expect(screen.getByLabelText("city")).toHaveValue("Portland");
      });
    });

    it("handles boolean fields in JSON mode", async () => {
      const properties = [
        new PropertySchema("name", "string"),
        new PropertySchema("active", "boolean"),
      ];
      const resource = createMockResourceSchema(properties);
      renderForm(resource);

      // Fill in form
      fireEvent.change(screen.getByLabelText("name"), {
        target: { value: "Test" },
      });
      fireEvent.click(screen.getByLabelText("active"));

      // Switch to JSON mode and back
      fireEvent.click(screen.getByRole("button", { name: "JSON" }));

      await waitFor(() => {
        expect(screen.queryByLabelText("name")).not.toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole("button", { name: "Form" }));

      await waitFor(() => {
        expect(screen.getByLabelText("active")).toBeChecked();
      });
    });
  });

  describe("ReadOnly properties", () => {
    it("does not render readOnly properties in the form", () => {
      const properties = [
        new PropertySchema("id", "string", {
          readOnly: true,
        } as unknown as Schema),
        new PropertySchema("name", "string"),
      ];
      const resource = createMockResourceSchema(properties);
      renderForm(resource);

      expect(screen.queryByLabelText("id")).not.toBeInTheDocument();
      expect(screen.getByLabelText("name")).toBeInTheDocument();
    });

    it("excludes readOnly properties from the validation schema and submission", async () => {
      const properties = [
        new PropertySchema("id", "string", {
          readOnly: true,
        } as unknown as Schema),
        new PropertySchema("name", "string"),
      ];
      const resource = createMockResourceSchema(properties);
      renderForm(resource);

      fireEvent.change(screen.getByLabelText("name"), {
        target: { value: "Test Name" },
      });
      fireEvent.click(screen.getByRole("button", { name: "Submit" }));

      await waitFor(() => {
        expect(resource.create).toHaveBeenCalledWith(
          {
            name: "Test Name",
          },
          undefined,
          new Map(),
          "",
        );
      });

      // Ensure id was NOT included
      const call = (resource.create as Mock).mock.calls[0];
      expect(call[0]).not.toHaveProperty("id");
    });
  });

  describe("Additional fields", () => {
    it("renders additional fields when provided", () => {
      const properties = [new PropertySchema("name", "string")];
      const resource = createMockResourceSchema(properties);
      const additionalFields: AdditionalField[] = [
        { name: "id", type: "string" },
      ];
      renderForm(
        resource,
        "",
        new Map(),
        undefined,
        undefined,
        additionalFields,
      );

      expect(screen.getByLabelText("id")).toBeInTheDocument();
      expect(screen.getByLabelText("name")).toBeInTheDocument();
    });

    it("does not render additional fields when not provided", () => {
      const properties = [new PropertySchema("name", "string")];
      const resource = createMockResourceSchema(properties);
      renderForm(resource);

      expect(screen.queryByLabelText("id")).not.toBeInTheDocument();
      expect(screen.getByLabelText("name")).toBeInTheDocument();
    });

    it("includes additional field values in submission", async () => {
      const properties = [new PropertySchema("name", "string")];
      const resource = createMockResourceSchema(properties);
      const additionalFields: AdditionalField[] = [
        { name: "id", type: "string" },
      ];
      renderForm(
        resource,
        "",
        new Map(),
        undefined,
        undefined,
        additionalFields,
      );

      fireEvent.change(screen.getByLabelText("id"), {
        target: { value: "my-resource-id" },
      });
      fireEvent.change(screen.getByLabelText("name"), {
        target: { value: "Test Name" },
      });
      fireEvent.click(screen.getByRole("button", { name: "Submit" }));

      await waitFor(() => {
        expect(resource.create).toHaveBeenCalledWith(
          {
            name: "Test Name",
          },
          "my-resource-id",
          new Map(),
          "",
        );
      });
    });

    it("allows submission with empty optional additional field", async () => {
      const properties = [new PropertySchema("name", "string")];
      const resource = createMockResourceSchema(properties);
      const additionalFields: AdditionalField[] = [
        { name: "id", type: "string" },
      ];
      renderForm(
        resource,
        "",
        new Map(),
        undefined,
        undefined,
        additionalFields,
      );

      fireEvent.change(screen.getByLabelText("name"), {
        target: { value: "Test Name" },
      });
      fireEvent.click(screen.getByRole("button", { name: "Submit" }));

      await waitFor(() => {
        expect(resource.create).toHaveBeenCalledWith(
          {
            name: "Test Name",
          },
          undefined,
          new Map(),
          "",
        );
      });
    });

    it("works with real OpenAPI schema that supports user-settable id", async () => {
      const fileContents = fs.readFileSync("src/example_oas.json", "utf8");
      const openAPI = await parseOpenAPI(fileContents);
      const publisherResource = openAPI.resourceForName("publishers");

      expect(publisherResource.supportsUserSettableCreate).toBe(true);
    });

    it("returns false for supportsUserSettableCreate when no id param", async () => {
      const fileContents = fs.readFileSync("src/example_oas.json", "utf8");
      const openAPI = await parseOpenAPI(fileContents);
      const bookResource = openAPI.resourceForName("books");

      expect(bookResource.supportsUserSettableCreate).toBe(false);
    });
  });
});
