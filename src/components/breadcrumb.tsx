import { useMatches, Link } from "react-router-dom";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbLink,
  BreadcrumbSeparator,
} from "./ui/breadcrumb";
import { createRouteObjects } from "@/lib/utils";
import { useAppSelector } from "@/hooks/store";
import { selectResources } from "@/state/store";

// Converts a pathname with actual param values back to its template form by replacing
// param values with their keys in {key} format (e.g., "/users/123" -> "/users/{userId}")
function substituteParamsWithKeys(
  pathname: string,
  params: Record<string, string | undefined>,
): string {
  let result = pathname;

  // Replace each param value with its key in {key} format
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) {
      result = result.replace(value, `{${key}}`);
    }
  }

  return result;
}

// AppBreadcrumb is responsible for building navigation.
export default function AppBreadcrumb() {
  const breadcrumbs = useMatches();
  const resources = useAppSelector(selectResources);

  const routeObjects = createRouteObjects(resources);

  const breadcrumb_elements = [];
  const seenLabels = new Set<string>();
  const uniqueBreadcrumbs: Array<{ pathname: string; label: string }> = [];
  let elementIndex = 0;

  // First pass: collect unique breadcrumbs
  for (const i of breadcrumbs) {
    // Substitute params to get the template path
    const templatePath = substituteParamsWithKeys(i.pathname, i.params);

    // Look up the breadcrumb label in routeObjects
    const breadcrumbLabel = routeObjects[templatePath];

    if (breadcrumbLabel === undefined) {
      throw new Error(
        `Breadcrumb route not found. ` +
          `Original pathname: "${i.pathname}", ` +
          `Template path: "${templatePath}", ` +
          `Params: ${JSON.stringify(i.params)}, ` +
          `Available routes: ${JSON.stringify(Object.keys(routeObjects))}`,
      );
    }

    // Skip duplicate breadcrumbs
    if (seenLabels.has(breadcrumbLabel)) {
      continue;
    }
    seenLabels.add(breadcrumbLabel);
    uniqueBreadcrumbs.push({ pathname: i.pathname, label: breadcrumbLabel });
  }

  // Second pass: render breadcrumbs with appropriate component
  for (let idx = 0; idx < uniqueBreadcrumbs.length; idx++) {
    const { pathname, label } = uniqueBreadcrumbs[idx];
    const isLast = idx === uniqueBreadcrumbs.length - 1;

    if (isLast) {
      // Last breadcrumb is not a link
      breadcrumb_elements.push(
        <BreadcrumbItem
          key={`item-${elementIndex}`}
          className="hidden md:block"
        >
          <BreadcrumbPage>{label}</BreadcrumbPage>
        </BreadcrumbItem>,
      );
    } else {
      // Other breadcrumbs are links
      breadcrumb_elements.push(
        <BreadcrumbItem
          key={`item-${elementIndex}`}
          className="hidden md:block"
        >
          <BreadcrumbLink asChild>
            <Link to={pathname}>{label}</Link>
          </BreadcrumbLink>
        </BreadcrumbItem>,
      );
    }
    elementIndex++;

    // Only add separator if it's not the last item
    if (!isLast) {
      breadcrumb_elements.push(
        <BreadcrumbSeparator
          key={`separator-${elementIndex}`}
          className="hidden md:block"
        />,
      );
      elementIndex++;
    }
  }

  return (
    <Breadcrumb>
      <BreadcrumbList>{breadcrumb_elements}</BreadcrumbList>
    </Breadcrumb>
  );
}
