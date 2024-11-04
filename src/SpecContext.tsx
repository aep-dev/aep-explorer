import { createContext, useContext } from 'react';
import { OpenAPI } from './openapi';

interface SpecContextType {
  spec: OpenAPI | null;
}

export const SpecContext = createContext<SpecContextType>({
  spec: null,
});

export const useSpec = () => useContext(SpecContext);
