import { useState } from 'react'
import './App.css'
import { StateContext } from './state/StateContext'
import { OpenAPI } from './state/openapi'
import SpecSpecifierPage from './app/spec_specifier/page'
import {
  createBrowserRouter,
  RouterProvider,
} from "react-router-dom";
import Page from './app/explorer/page'

const router = createBrowserRouter([
  {
    path: "/",
    element: <SpecSpecifierPage />
  },
  {
    path: "/explorer",
    element: <Page />
  }
]);

function App() {
  const [state, setState] = useState(new OpenAPI({}));
  return (
      <StateContext.Provider value={{spec: state, setSpec: setState}}>
        <RouterProvider router={router} />
      </StateContext.Provider>
  )
}

export default App
