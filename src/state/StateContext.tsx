import { createContext, useContext } from "react";
import { OpenAPI } from "./openapi";

interface StateContext {
  spec: OpenAPI | null;
  setSpec: ((oas: OpenAPI) => void) | null;
}

export const StateContext = createContext<StateContext>({
  spec: null,
  setSpec: null,
});

export const useSpec = () => useContext(StateContext);

interface HeadersContext {
  headers: string | null;
  setHeaders: ((headers: string) => void) | null;
}

export const HeadersContext = createContext<HeadersContext>({
  headers: null,
  setHeaders: null,
});

export const useHeaders = () => useContext(HeadersContext);