import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { OpenAPI } from "@/state/openapi";
import { useSpec } from "@/state/StateContext";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

export function LoginForm() {
  const [state, setState] = useState('');
  const navigate = useNavigate();


  const { spec, setSpec } = useSpec();

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      const response = await fetch(state);
      const data = await response.json();
      setSpec!(new OpenAPI(data));
      navigate("/explorer");
    } catch (error) {
      console.error("Failed to fetch OpenAPI spec:", error);
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
  )
}
