import { ResourceSchema } from "@/state/openapi";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function createRouteObjects(resources: ResourceSchema[]): object {
  if(resources === null) {
    return {};
  }
  return resources.reduce((acc, resource) => {
    acc[resource.base_url()] = `${resource.plural_name}`;
    acc[`${resource.base_url()}/_create`] = `${resource.singular_name} Create`;
    acc[`${resource.base_url()}/:resourceId`] = `${resource.singular_name} Info`;
    acc[`${resource.base_url()}/:resourceId/_update`] = `${resource.singular_name} Update`;
    return acc;
  }, {});
}