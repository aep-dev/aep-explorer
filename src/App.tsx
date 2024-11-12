import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import Fetcher from './Fetcher'
import { StateContext } from './state/StateContext'
import { OpenAPI } from './state/openapi'
import Page from './app/spec_specifier/page'
import {
  createBrowserRouter,
  RouterProvider,
} from "react-router-dom";

const router = createBrowserRouter([
  {
    path: "/",
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
