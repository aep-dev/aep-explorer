import { LoginForm } from "@/components/login-form";
import { useAppSelector } from "@/hooks/store";
import { schemaState } from "@/state/store";

export default function SpecSpecifierPage() {
  const state = useAppSelector(schemaState);
  if(state == 'unset') {
    return (
      <div className="flex h-screen w-full items-center justify-center px-4">
        <LoginForm />
      </div>
    )
  } else {
    return <div />
  }
}
