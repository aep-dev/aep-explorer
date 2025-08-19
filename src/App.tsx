import { ResourceSchema } from "./state/openapi";
import SpecSpecifierPage from "./app/spec_specifier/page";
import { createBrowserRouter, RouteObject, RouterProvider } from "react-router-dom";
import Layout from "./app/explorer/page";
import ResourceListPage from "./app/explorer/resource_list";
import CreateForm from "./components/form/form";
import InfoPage from "./app/explorer/info";
import UpdateForm from "./app/explorer/update_form";

import { selectResources, store } from './state/store';
import { Provider } from 'react-redux'
import { useAppSelector } from "./hooks/store";

function transformUrlForRouter(url: string): string {
  return url.replace(/\{([^}]+)\}/g, ':$1');
}

function createRoutes(resources: ResourceSchema[]): RouteObject[] {
  const routes = [{
    path: "/",
    element: <Layout />,
    children: [
      {
        path: "/",
        element: <SpecSpecifierPage />,
      },
    ].concat(resources.map((resource) => {
      const baseUrl = transformUrlForRouter(resource.base_url());
      return [
        {
          path: baseUrl,
          element: <ResourceListPage resource={resource} />
        },
        {
          path: `${baseUrl}/_create`,
          element: <CreateForm resource={resource} />
        },
        {
          path: `${baseUrl}/:resourceId`,
          element: <InfoPage resource={resource} />
        },
        {
          path: `${baseUrl}/:resourceId/_update`,
          element: <UpdateForm schema={resource} />
        }
      ]
    }).flat(1))
  }];
  return routes;
}

function App() {
  return (
    <Provider store={store} >
        <Routes />
    </Provider>
  );
}

function Routes() {
  const resources = useAppSelector(selectResources);
  return (
      <RouterProvider router={createBrowserRouter(createRoutes(resources))} />
  )
}

export default App;
