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
                    <ResourceMenuItem resource={resource} />
                ))}
            </SidebarMenu>
        </SidebarGroup>
    );
}

type ResourceMenuItemProps = {
    resource: ResourceSchema
};

function ResourceMenuItem(props: ResourceMenuItemProps) {
    return (
        <SidebarMenuItem key={props.resource.singular_name}>
            <SidebarMenuButton asChild>
                <Link to={`${props.resource.base_url()}`}>
                    <span>{props.resource.plural_name}</span>
                </Link>
            </SidebarMenuButton>
        </SidebarMenuItem>
    )
}