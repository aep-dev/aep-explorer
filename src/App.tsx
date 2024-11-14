import "./App.css";
import { useState } from "react";
import { StateContext } from "./state/StateContext";
import { OpenAPI } from "./state/openapi";
import SpecSpecifierPage from "./app/spec_specifier/page";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import Page from "./app/explorer/page";
import ResourceList from "./app/explorer/resource_list";

const router = createBrowserRouter([
  {
    path: "/",
    element: <Page />,
    children: [
      {
        path: "/",
        element: <SpecSpecifierPage />,
      },
      {
        path: "/explorer",
        element: <Page />,
      },
      {
        path: "/explorer/:resourceId",
        element: <ResourceList />,
      },
    ],
  },
]);

function App() {
  const [state, setState] = useState(new OpenAPI({}));
  return (
    <StateContext.Provider value={{ spec: state, setSpec: setState }}>
      <RouterProvider router={router} />
    </StateContext.Provider>
  );
}

export default App;
