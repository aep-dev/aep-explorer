import { SidebarGroup, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar";
import { ResourceSchema } from "@/state/openapi";
import { Link } from "react-router-dom";

type ResourceTypeListProps = {
    resources: ResourceSchema[];
};

export function ResourceTypeList(props: ResourceTypeListProps) {
    return (
        <SidebarGroup>
            <SidebarGroupLabel>Resources</SidebarGroupLabel>
            <SidebarMenu>
                {props.resources.map((resource: ResourceSchema) => (
                    <SidebarMenuItem key={resource.singular_name}>
                        <SidebarMenuButton asChild>
                            <Link to={`${resource.base_url()}`}>
                                <span>{resource.plural_name}</span>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                ))}
            </SidebarMenu>
        </SidebarGroup>
    );
}