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

// A form to select an OpenAPI spec URL and set it in the application state.
export function OASSelector() {
  const [state, setState] = useState("");
  const dispatch = useAppDispatch();

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      const response = await fetch(state);
      const data = await response.json();
      dispatch(setSchema(new OpenAPI(data)));
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
              onChange={(event) => setState(event.target.value)}
              required
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
