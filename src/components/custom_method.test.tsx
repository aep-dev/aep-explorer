/* eslint-disable @typescript-eslint/no-explicit-any */
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { CustomMethod } from "@aep_dev/aep-lib-ts";
import { CustomMethodComponent } from "./custom_method";
import { ResourceInstance } from "@/state/fetch";
import { ResourceSchema } from "@/state/openapi";

// Mock fetch globally
global.fetch = vi.fn();

describe("CustomMethodComponent", () => {
  const mockResourceSchema = {
    server_url: "http://localhost:8080",
  } as ResourceSchema;

  const createMockResourceInstance = (path: string): ResourceInstance => {
    return {
      id: "123",
      path: path,
      properties: { path: path },
      schema: mockResourceSchema,
      delete: vi.fn(),
      update: vi.fn(),
    } as unknown as ResourceInstance;
  };

  const createMockCustomMethod = (
    name: string,
    request: any = null,
  ): CustomMethod => {
    return {
      name,
      method: "POST",
      request,
      response: null,
    };
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (global.fetch as any).mockClear();
  });

  it("renders and submits custom method without request fields", async () => {
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({ success: true }),
    });

    const customMethod = createMockCustomMethod("archive", null);
    const resourceInstance = createMockResourceInstance("books/123");

    render(
      <CustomMethodComponent
        resourceInstance={resourceInstance}
        customMethod={customMethod}
      />,
    );

    expect(screen.getByText("archive")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Submit" }));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "http://localhost:8080/books/123:archive",
        expect.objectContaining({
          method: "POST",
          body: undefined,
        }),
      );
    });

    expect(screen.getByText("Response:")).toBeInTheDocument();
    expect(screen.getByText(/"success": true/)).toBeInTheDocument();
  });

  it("renders form fields and validates before submission", async () => {
    const requestSchema = {
      type: "object",
      properties: {
        reason: { type: "string" },
        priority: { type: "integer" },
      },
      required: ["reason"],
    };

    const customMethod = createMockCustomMethod("archive", requestSchema);
    const resourceInstance = createMockResourceInstance("books/123");

    render(
      <CustomMethodComponent
        resourceInstance={resourceInstance}
        customMethod={customMethod}
      />,
    );

    expect(screen.getByLabelText("reason")).toBeInTheDocument();
    expect(screen.getByLabelText("priority")).toBeInTheDocument();

    // Submit without filling required field
    fireEvent.click(screen.getByRole("button", { name: "Submit" }));

    await waitFor(() => {
      expect(screen.getByText("Required")).toBeInTheDocument();
    });

    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("submits form with valid data and displays response", async () => {
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({ status: "archived", timestamp: "2024-01-01" }),
    });

    const requestSchema = {
      type: "object",
      properties: {
        reason: { type: "string" },
        priority: { type: "integer" },
      },
      required: ["reason"],
    };

    const customMethod = createMockCustomMethod("archive", requestSchema);
    const resourceInstance = createMockResourceInstance("books/123");

    render(
      <CustomMethodComponent
        resourceInstance={resourceInstance}
        customMethod={customMethod}
      />,
    );

    fireEvent.change(screen.getByLabelText("reason"), {
      target: { value: "outdated" },
    });
    fireEvent.change(screen.getByLabelText("priority"), {
      target: { value: "5" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Submit" }));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "http://localhost:8080/books/123:archive",
        expect.objectContaining({
          body: JSON.stringify({ reason: "outdated", priority: 5 }),
        }),
      );
    });

    expect(screen.getByText(/"status": "archived"/)).toBeInTheDocument();
  });

  it("handles nested objects in request schema", async () => {
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({ success: true }),
    });

    const requestSchema = {
      type: "object",
      properties: {
        metadata: {
          type: "object",
          properties: {
            reason: { type: "string" },
            notes: { type: "string" },
          },
        },
      },
    };

    const customMethod = createMockCustomMethod("archive", requestSchema);
    const resourceInstance = createMockResourceInstance("books/123");

    render(
      <CustomMethodComponent
        resourceInstance={resourceInstance}
        customMethod={customMethod}
      />,
    );

    expect(screen.getByText("metadata")).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("reason"), {
      target: { value: "outdated" },
    });
    fireEvent.change(screen.getByLabelText("notes"), {
      target: { value: "no longer relevant" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Submit" }));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "http://localhost:8080/books/123:archive",
        expect.objectContaining({
          body: JSON.stringify({
            metadata: { reason: "outdated", notes: "no longer relevant" },
          }),
        }),
      );
    });
  });

  it("displays error when request fails", async () => {
    (global.fetch as any).mockResolvedValue({
      ok: false,
      status: 500,
    });

    const customMethod = createMockCustomMethod("archive", null);
    const resourceInstance = createMockResourceInstance("books/123");

    render(
      <CustomMethodComponent
        resourceInstance={resourceInstance}
        customMethod={customMethod}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Submit" }));

    await waitFor(() => {
      expect(screen.getByText(/"error":/)).toBeInTheDocument();
    });
  });

  it("shows loading state during submission", async () => {
    let resolvePromise: (value: any) => void;
    const promise = new Promise((resolve) => {
      resolvePromise = resolve;
    });

    (global.fetch as any).mockReturnValue(promise);

    const customMethod = createMockCustomMethod("archive", null);
    const resourceInstance = createMockResourceInstance("books/123");

    render(
      <CustomMethodComponent
        resourceInstance={resourceInstance}
        customMethod={customMethod}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Submit" }));

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: "Submitting..." }),
      ).toBeDisabled();
    });

    resolvePromise!({ ok: true, json: async () => ({ success: true }) });

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Submit" })).not.toBeDisabled();
    });
  });
});
