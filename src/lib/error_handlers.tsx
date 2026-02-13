import { ReactNode } from "react";
import { NavigateFunction } from "react-router-dom";
import { MissingParentError } from "./errors";
import { store } from "@/state/store";
import { Button } from "@/components/ui/button";
import { ResourceSchema } from "@/state/openapi";

export interface ErrorHandlerContext {
    error: Error | unknown;
    reset: () => void;
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

export function findErrorHandler(error: Error | unknown): SemanticErrorHandler | null {
    for (const handler of errorHandlers) {
        if (handler.match(error)) {
            return handler;
        }
    }
    return null;
}

export const MissingParentErrorHandler: SemanticErrorHandler = {
    match: (error) => error instanceof MissingParentError,

    title: () => "Missing Parent Resource",

    description: (error) => {
        const e = error as MissingParentError;
        return `No parents found for ${e.resourceName}. You need to create a ${e.resourceName} first.`;
    },

    action: (error, { reset, navigate }) => {
        const e = error as MissingParentError;

        // Try to find the parent resource to give a direct link
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const state = store.getState() as any;
        const resources = state.schema?.value?.resources() || [];
        // naive matching: param name often matches singular name
        const parentResource = resources.find((r: ResourceSchema) => r.singular_name === e.resourceName);

        if (parentResource) {
            const createUrl = parentResource.substituteUrlParameters(parentResource.base_url());

            return (
                <div className="flex gap-2">
                    <Button variant="outline" onClick={reset}>Go Home</Button>
                    <Button onClick={() => {
                        navigate(createUrl)
                    }}>
                        See {parentResource.plural_name}
                    </Button>
                </div>
            );
        }

        return <Button onClick={reset}>Go Home</Button>;
    }
};

registerErrorHandler(MissingParentErrorHandler);
