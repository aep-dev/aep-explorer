import { Component, ErrorInfo, ReactNode } from "react";
import { useRouteError, useNavigate } from "react-router-dom";
import { findErrorHandler } from "@/lib/error_handlers";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface ErrorDisplayProps {
  error: Error | unknown;
  reset: () => void;
}

export function ErrorDisplay({ error, reset }: ErrorDisplayProps) {
  const navigate = useNavigate();
  const errorMessage =
    (error as Error)?.message ||
    (typeof error === "string" ? error : "Something went wrong.");
  let title = "An error occurred";
  let description = errorMessage;
  let action = <Button onClick={reset}>Go Home</Button>;

  const handler = findErrorHandler(error);
  if (handler) {
    title = handler.title(error);
    description = handler.description(error);
    const actionContent = handler.action(error, { error, reset, navigate });
    if (actionContent) {
      action = <>{actionContent}</>;
    }
  }

  return (
    <Dialog open={true} onOpenChange={() => reset()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter>{action}</DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  private handleClose = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = "/";
  };

  public render() {
    if (this.state.hasError) {
      return <ErrorDisplay error={this.state.error} reset={this.handleClose} />;
    }

    return this.props.children;
  }
}

export function RouteErrorBoundary() {
  const error = useRouteError();
  const navigate = useNavigate();

  const handleClose = () => {
    navigate("/");
  };

  return <ErrorDisplay error={error} reset={handleClose} />;
}
