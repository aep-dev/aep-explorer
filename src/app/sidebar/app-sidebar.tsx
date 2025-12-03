import * as React from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarRail,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";
import { useAppSelector } from "@/hooks/store";
import { selectRootResources } from "@/state/store";
import { ResourceTypeList } from "@/components/resource_types/resource_type_list";
import { Home } from "lucide-react";
import { Link } from "react-router-dom";

// The AppSidebar. This fetches the list of root resources from the schema and displays them.
export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const resources = useAppSelector(selectRootResources);

  return (
    <Sidebar {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <Link to="/">
                <Home className="h-4 w-4" />
                <span>Home</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <ResourceTypeList resources={resources} />
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}
