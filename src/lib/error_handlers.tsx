import { ReactNode } from "react";
import { NavigateFunction } from "react-router-dom";
import { MissingParentError } from "./errors";
import { store } from "@/state/store";
import { Button } from "@/components/ui/button";
import { ResourceSchema } from "@/state/openapi";

export interface ErrorHandlerContext {
  error: Error | unknown;
  reset: (path?: string) => void;
  navigate: NavigateFunction;
}

export interface SemanticErrorHandler {
  // Returns true if this handler can handle the error
  match: (error: Error | unknown) => boolean;

  // Returns the title for the error dialog
  title: (error: Error | unknown) => string;

  // Returns the description for the error dialog
  description: (error: Error | unknown) => string;

  // Returns the action buttons/components for the error dialog
  action: (error: Error | unknown, context: ErrorHandlerContext) => ReactNode;
}

export const errorHandlers: SemanticErrorHandler[] = [];

export function registerErrorHandler(handler: SemanticErrorHandler) {
  errorHandlers.push(handler);
}

export function findErrorHandler(
  error: Error | unknown,
): SemanticErrorHandler | null {
  for (const handler of errorHandlers) {
    if (handler.match(error)) {
      return handler;
    }
  }
  return null;
}

import { useState } from "react";
import { Input } from "@/components/ui/input";

// eslint-disable-next-line react-refresh/only-export-components
function MissingParentActionForm({
  error,
  reset,
  parentUrl,
  parentName,
}: {
  error: MissingParentError;
  reset: (path?: string) => void;
  parentUrl?: string;
  parentName?: string;
}) {
  const [inputValue, setInputValue] = useState("");

  const handleSubmit = () => {
    if (!inputValue) return;

    const currentPath = window.location.pathname;
    // Replace the missing parameter (e.g., "{shelf}" or ":shelf") with the inputted value
    // React Router patterns use :paramName, but raw URLs might still have {paramName}
    const newPath = currentPath
      .replace(`%7B${error.resourceName}%7D`, inputValue)
      .replace(`:${error.resourceName}`, inputValue);
    console.log(newPath);

    // If the path didn't change (e.g. they typed the raw path, or it's a URL parameter),
    // attempt to replace the resourceName itself as a directory name if nothing else matched.
    // However, typically the path has {shelf} literally, or the parent id is missing from the list path.
    // E.g., /shelves/{shelf}/books

    // Use reset(newPath) to clear the error state and navigate simultaneously,
    // avoiding the default reset() behavior which redirects to "/".
    reset(newPath);
  };

  return (
    <div className="flex flex-col gap-4 w-full">
      <div className="flex flex-col gap-2">
        <label htmlFor="parentIdInput" className="text-sm font-medium">
          {error.resourceName} ID
        </label>
        <div className="flex gap-2">
          <Input
            id="parentIdInput"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={`Enter ${error.resourceName} ID`}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleSubmit();
              }
            }}
          />
        </div>
      </div>
      <div className="flex gap-2 justify-end">
        {parentUrl && parentName && (
          <Button variant="outline" onClick={() => reset(parentUrl)}>
            See {parentName}
          </Button>
        )}
        <Button variant="outline" onClick={() => reset()}>
          Cancel
        </Button>
        <Button onClick={handleSubmit} disabled={!inputValue}>
          Submit and Navigate
        </Button>
      </div>
    </div>
  );
}

export const MissingParentErrorHandler: SemanticErrorHandler = {
  match: (error) => error instanceof MissingParentError,

  title: () => "Missing Parent Resource",

  description: (error) => {
    const e = error as MissingParentError;
    return `Please provide the missing ${e.resourceName} ID to continue.`;
  },

  action: (error, { reset }) => {
    const e = error as MissingParentError;

    // Try to find the parent resource to give a direct link
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const state = store.getState() as any;
    const resources = state.schema?.value?.resources() || [];
    // naive matching: param name often matches singular name
    const parentResource = resources.find(
      (r: ResourceSchema) => r.singular_name === e.resourceName,
    );

    let parentUrl;
    let parentName;
    if (parentResource) {
      try {
        const parentsMap = new Map(Object.entries(e.availableParents || {}));
        parentUrl = parentResource.substituteUrlParameters(
          parentResource.base_url(),
          parentsMap,
        );
        parentName = parentResource.plural_name;
      } catch {
        // Unlikely to happen unless the parent itself is missing its own parent
      }
    }

    return (
      <MissingParentActionForm
        error={e}
        reset={reset}
        parentUrl={parentUrl}
        parentName={parentName}
      />
    );
  },
};

registerErrorHandler(MissingParentErrorHandler);
