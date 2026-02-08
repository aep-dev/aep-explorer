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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronDown } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/hooks/store";
import { toast } from "@/hooks/use-toast";
import { OpenAPI } from "@/state/openapi";
import {
  setSchema,
  setSpecConfig,
  selectSpecConfig,
  schemaState,
  selectHeaders,
  setHeaders,
  selectMockServerEnabled,
  setMockServerEnabled
} from "@/state/store";
import { useState, useEffect, useRef } from "react";
import { fetchOpenAPI, APIClient } from "@aep_dev/aep-lib-ts";

interface SpecSpecifier {
  url: string;
  prefix?: string;
}

// Settings form for configuring the OpenAPI document URL, headers, and mock server.
export function Settings() {
  const specConfig = useAppSelector(selectSpecConfig);
  const currentSchemaState = useAppSelector(schemaState);
  const headers = useAppSelector(selectHeaders);
  const mockServerEnabled = useAppSelector(selectMockServerEnabled);
  const [state, setState] = useState<SpecSpecifier>({ url: "", prefix: "" });
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const dispatch = useAppDispatch();
  const hasAutoLoaded = useRef(false);

  // Load persisted spec config on mount
  useEffect(() => {
    if (specConfig.url) {
      setState({ url: specConfig.url, prefix: specConfig.prefix });
    }
  }, [specConfig.url, specConfig.prefix]);

  // Auto-reload schema if URL is persisted but schema is not loaded
  useEffect(() => {
    const autoLoadSchema = async () => {
      if (specConfig.url && currentSchemaState === 'unset' && !hasAutoLoaded.current) {
        hasAutoLoaded.current = true;
        try {
          const openApiSpec = await fetchOpenAPI(specConfig.url);
          const apiClient = await APIClient.fromOpenAPI(
            openApiSpec,
            specConfig.prefix || undefined
          );
          dispatch(setSchema(new OpenAPI(apiClient)));
        } catch (error) {
          toast({ description: `Failed to auto-load OpenAPI document: ${error}` })
        }
      }
    };
    autoLoadSchema();
  }, [specConfig.url, specConfig.prefix, currentSchemaState, dispatch]);

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      const openApiSpec = await fetchOpenAPI(state.url);
      const apiClient = await APIClient.fromOpenAPI(
        openApiSpec,
        state.prefix || undefined
      );
      dispatch(setSchema(new OpenAPI(apiClient)));
      // Persist the spec config
      dispatch(setSpecConfig({ url: state.url, prefix: state.prefix || "" }));
    } catch (error) {
      toast({ description: `Failed to fetch OpenAPI document: ${error}` })
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
              value={state.url}
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
              value={state.prefix || ""}
              onChange={(event) => setState({ ...state, prefix: event.target.value })}
            />
            <p className="text-xs text-muted-foreground">
              If your API uses a path prefix (e.g., /api/v1), specify it here.
            </p>
          </div>

          <Collapsible open={advancedOpen} onOpenChange={setAdvancedOpen}>
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                className="w-full justify-between p-2 h-auto font-normal"
                type="button"
              >
                <span className="text-sm font-medium">Advanced Settings</span>
                <ChevronDown
                  className={`h-4 w-4 transition-transform ${advancedOpen ? 'rotate-180' : ''}`}
                />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-4 pt-4">
              <div className="grid gap-2">
                <Label htmlFor="headers">Custom Headers</Label>
                <Input
                  id="headers"
                  type="text"
                  placeholder="key:value,key:value"
                  value={headers}
                  onChange={(event) => dispatch(setHeaders(event.target.value))}
                />
                <p className="text-xs text-muted-foreground">
                  Add custom HTTP headers (format: key:value,key:value)
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="mock-server"
                  checked={mockServerEnabled}
                  onCheckedChange={(checked) => dispatch(setMockServerEnabled(!!checked))}
                />
                <Label
                  htmlFor="mock-server"
                  className="text-sm font-normal cursor-pointer"
                >
                  Use Mock Server
                </Label>
              </div>
              <p className="text-xs text-muted-foreground -mt-2">
                Enable to use an in-memory mock server instead of making real API calls
              </p>
            </CollapsibleContent>
          </Collapsible>

          <Button onClick={onSubmit} type="submit" className="w-full">
            Explore Resources
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
