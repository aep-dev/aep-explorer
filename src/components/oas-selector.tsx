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
import { useAppDispatch } from "@/hooks/store";
import { toast } from "@/hooks/use-toast";
import { OpenAPI } from "@/state/openapi";
import { setSchema } from "@/state/store";
import { useState } from "react";
import { fetchOpenAPI, APIClient } from "@aep_dev/aep-lib-ts";

interface SpecSpecifier {
  url: string;
  prefix?: string;
}

// A form to select an OpenAPI spec URL and set it in the application state.
export function OASSelector() {
  const [state, setState] = useState<SpecSpecifier>({ url: "", prefix: "" });
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
      toast({description: `Failed to fetch OpenAPI spec: ${error}`})
    }
  };

  return (
    <Card className="mx-auto max-w-sm">
      <CardHeader>
        <CardTitle className="text-2xl">AEP UI</CardTitle>
        <CardDescription>
          Enter a URL to your AEP-compliant OpenAPI Spec to continue.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="spec">OpenAPI Spec</Label>
            <Input
              id="spec"
              type="url"
              placeholder="example.com/openapi.json"
              onChange={(event) => setState({ ...state, url: event.target.value })}
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="prefix">Path Prefix (optional)</Label>
            <Input
              id="prefix"
              type="text"
              placeholder="/api/v1"
              onChange={(event) => setState({ ...state, prefix: event.target.value })}
            />
          </div>
          <Button onClick={onSubmit} type="submit" className="w-full">
            Continue
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
