import "./App.css";
import { useState } from "react";
import { StateContext } from "./state/StateContext";
import { OpenAPI, ResourceSchema } from "./state/openapi";
import SpecSpecifierPage from "./app/spec_specifier/page";
import { createBrowserRouter, RouteObject, RouterProvider } from "react-router-dom";
import Page from "./app/explorer/page";
import ResourceList from "./app/explorer/resource_list";
import CreateForm from "./app/explorer/form";
import InfoPage from "./app/explorer/info";
import UpdateForm from "./app/explorer/update_form";

function createRoutes(resources: ResourceSchema[]): RouteObject[] {
  let routes = [{
    path: "/",
    element: <Page />,
    children: [
      {
        path: "/",
        element: <SpecSpecifierPage />,
      },
      {
        path: "/_explorer",
        element: <Page />,
      },
    ].concat(resources.map((resource) => {
      return [
        {
          path: resource.base_url(),
          element: <ResourceList resource={resource} />
        },
        {
          path: `${resource.base_url()}/_create`,
          element: <CreateForm resource={resource} />
        },
        {
          path: `${resource.base_url()}/:resourceId`,
          element: <InfoPage resource={resource} />
        },
        {
          path: `${resource.base_url()}/:resourceId/_update`,
          element: <UpdateForm schema={resource} />
        }
      ]
    }).flat(1))
  }];
  console.log("my routes");
  console.log(routes);
  return routes;
}

function App() {
  const [state, setState] = useState(new OpenAPI({}));
  return (
    <StateContext.Provider value={{ spec: state, setSpec: setState  }}>
      <RouterProvider router={createBrowserRouter(createRoutes(state.resources()))} />
    </StateContext.Provider>
  );
}

export default App;
