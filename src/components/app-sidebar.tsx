import * as React from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInput,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import { Link } from "react-router-dom";
import { useAppSelector } from "@/hooks/store";
import { selectResources } from "@/state/store";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const resources = useAppSelector(selectResources);

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader></SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Resources</SidebarGroupLabel>
          <SidebarMenu>
            {resources.map((resource) => (
              <SidebarMenuItem key={resource.singular_name}>
                <SidebarMenuButton asChild>
                  <Link to={`/${resource.base_url()}`}>
                    <span>{resource.plural_name}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
        <p>Headers</p>
        <p>key:value, comma-deliniated</p>
        <TextBoxComponent />
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}

export function TextBoxComponent() {
  const {headers, setHeaders} = useHeaders();

  const handleTextChange = (event) => {
    setHeaders(event.target.value);
  };

  return (
    <SidebarInput type="text" value={headers!} onChange={handleTextChange} />
  );
}
