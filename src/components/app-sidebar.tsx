import * as React from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
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
import { useHeaders } from "@/state/StateContext";
import { Label } from "./ui/label";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const resources = useAppSelector(selectResources);

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <HeadersInput />
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Resources</SidebarGroupLabel>
          <SidebarMenu>
            {resources.map((resource) => (
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
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}

export function HeadersInput() {
  const { headers, setHeaders } = useHeaders();

  const handleTextChange = (event) => {
    setHeaders(event.target.value);
  };

  return (
    <form>
      <SidebarGroup className="py-0">
        <SidebarGroupContent className="relative">
          <Label htmlFor="headers" className="sr-only">
            Headers
          </Label>
          <SidebarInput id="headers"
            placeholder="Headers - Key:value, comma-delineated"
            type="text"
            value={headers!}
            onChange={handleTextChange} />
        </SidebarGroupContent>
      </SidebarGroup>
    </form>
  );
}
