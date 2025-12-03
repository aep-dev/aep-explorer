import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useAppDispatch, useAppSelector } from "@/hooks/store";
import { toast } from "@/hooks/use-toast";
import { OpenAPI } from "@/state/openapi";
import { setSchema, selectMockServerEnabled, setMockServerEnabled } from "@/state/store";
import { useState } from "react";
import { fetchOpenAPI, APIClient } from "@aep_dev/aep-lib-ts";

interface SpecSpecifier {
  url: string;
  prefix?: string;
}

// A form to select an OpenAPI document URL and set it in the application state.
export function OASSelector() {
  const [state, setState] = useState<SpecSpecifier>({ url: "", prefix: "" });
  const mockServerEnabled = useAppSelector(selectMockServerEnabled);
  const dispatch = useAppDispatch();

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      const openApiSpec = await fetchOpenAPI(state.url);
      const apiClient = await APIClient.fromOpenAPI(
        openApiSpec,
        state.prefix || undefined
      );
      dispatch(setSchema(new OpenAPI(apiClient)));
    } catch (error) {
      toast({description: `Failed to fetch OpenAPI document: ${error}`})
    }
  };

  return (
    <Card className="mx-auto max-w-2xl">
      <CardHeader>
        <CardTitle className="text-2xl">AEP Explorer</CardTitle>
        <CardDescription className="space-y-2">
          <p>
            A web interface for exploring and interacting with{" "}
            <a
              href="https://aep.dev"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-foreground"
            >
              AEP-compliant
            </a>{" "}
            APIs.
          </p>
          <p className="pt-2">
            <strong>What you can do:</strong>
          </p>
          <ul className="list-disc list-inside space-y-1 text-sm">
            <li>View all resources exposed by your API</li>
            <li>Browse and filter objects within collections</li>
            <li>Create, read, update, and delete resources</li>
            <li>Explore resource relationships and custom methods</li>
          </ul>
          <p className="pt-2">
            Enter a URL for your AEP-compliant, OpenAPI document to get started.
          </p>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="spec">OpenAPI document URL</Label>
            <Input
              id="spec"
              type="url"
              placeholder="https://example.com/openapi.json"
              onChange={(event) => setState({ ...state, url: event.target.value })}
              required
            />
            <p className="text-xs text-muted-foreground">
              The URL should point to a valid OpenAPI 3.0+ document for an AEP-compliant API.
            </p>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="prefix">Path Prefix (optional)</Label>
            <Input
              id="prefix"
              type="text"
              placeholder="/api/v1"
              onChange={(event) => setState({ ...state, prefix: event.target.value })}
            />
            <p className="text-xs text-muted-foreground">
              If your API uses a path prefix (e.g., /api/v1), specify it here.
            </p>
          </div>
          <div className="grid gap-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="mock-server"
                checked={mockServerEnabled}
                onCheckedChange={(checked) => dispatch(setMockServerEnabled(checked === true))}
              />
              <Label
                htmlFor="mock-server"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Use Mock Server
              </Label>
            </div>
            <p className="text-xs text-muted-foreground">
              Experimental. Uses generated mock data; no network calls will be made to your API.
            </p>
          </div>
          <Button onClick={onSubmit} type="submit" className="w-full">
            Explore Resources
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
