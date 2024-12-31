import { useMatches } from "react-router-dom";
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "./ui/breadcrumb"
import { createRouteObjects } from "@/lib/utils";
import { useAppSelector } from "@/hooks/store";
import { selectResources } from "@/state/store";

export default function AppBreadcrumb() {
    const breadcrumbs = useMatches();
    const resources = useAppSelector(selectResources);

    const routeObjects = createRouteObjects(resources);

    const breadcrumb_elements = [];
    for(const i of breadcrumbs) {
        breadcrumb_elements.push(<BreadcrumbItem className="hidden md:block">
                        <BreadcrumbPage>{routeObjects[i.pathname]}</BreadcrumbPage>
                    </BreadcrumbItem>);
        breadcrumb_elements.push(<BreadcrumbSeparator className="hidden md:block" />);
    }

    return (
    <Breadcrumb>
        <BreadcrumbList>
            {breadcrumb_elements}
        </BreadcrumbList>
    </Breadcrumb>
    );
}