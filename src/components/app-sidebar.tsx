import * as React from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarInput,
  SidebarRail,
} from "@/components/ui/sidebar";
import { useAppDispatch, useAppSelector } from "@/hooks/store";
import { selectHeaders, selectParentResources, setHeaders } from "@/state/store";
import { Label } from "./ui/label";
import { ResourceTypeList } from "@/app/sidebar/resource_type_list";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const resources = useAppSelector(selectParentResources);

  return (
    <Sidebar {...props}>
      <SidebarHeader>
        <HeadersInput />
      </SidebarHeader>
      <SidebarContent>
        <ResourceTypeList resources={resources} />
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}

export function HeadersInput() {
  const headers = useAppSelector(selectHeaders);
  const dispatch = useAppDispatch();

  const handleTextChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    dispatch(setHeaders(event.target.value));
  };

  return (
    <form>
      <SidebarGroup className="py-0">
        <SidebarGroupContent className="relative">
          <Label htmlFor="headers" className="sr-only">
            Headers
          </Label>
          <SidebarInput
            id="headers"
            placeholder="Headers"
            type="text"
            value={headers!}
            onChange={handleTextChange} />
        </SidebarGroupContent>
      </SidebarGroup>
    </form>
  );
}
