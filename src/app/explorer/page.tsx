import { AppSidebar } from "@/app/sidebar/app-sidebar";
import AppBreadcrumb from "@/components/breadcrumb";
import {} from "@/components/ui/breadcrumb";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Toaster } from "@/components/ui/toaster";
import { Separator } from "@radix-ui/react-separator";
import { Outlet } from "react-router-dom";

export default function Layout() {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <AppBreadcrumb />
        </header>
        <div className="p-4">
          <Outlet />
        </div>
        <Toaster />
      </SidebarInset>
    </SidebarProvider>
  );
}
