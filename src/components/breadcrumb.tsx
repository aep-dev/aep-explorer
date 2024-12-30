import { useMatches } from "react-router-dom";
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "./ui/breadcrumb"

export default function AppBreadcrumb() {
    const breadcrumbs = useMatches();

    const breadcrumb_elements = [];
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