import { useMatches } from "react-router-dom";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "./ui/breadcrumb"
import { createRouteObjects } from "@/lib/utils";
import { useSpec } from "@/state/StateContext";

export default function AppBreadcrumb() {
    const breadcrumbs = useMatches();
    const {spec, setSpec} = useSpec();
    console.log(breadcrumbs);
    console.log(createRouteObjects(spec?.resources()));

    let breadcrumb_elements = [];
    for(const i of breadcrumbs) {
        breadcrumb_elements.push(<BreadcrumbItem className="hidden md:block">
                        <BreadcrumbPage>{i.pathname}</BreadcrumbPage>
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