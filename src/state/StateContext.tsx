import { createContext, useContext } from 'react';
import { OpenAPI } from './openapi';

interface StateContext {
  spec: OpenAPI | null;
  setSpec: ((oas: OpenAPI) => void) | null;
}

export const StateContext = createContext<StateContext>({
  spec: null,
  setSpec: null,
});

export const useSpec = () => useContext(StateContext);
