import { OASSelector } from "@/components/oas-selector";
import { useAppSelector } from "@/hooks/store";
import { schemaState } from "@/state/store";

export default function SpecSpecifierPage() {
  const state = useAppSelector(schemaState);
  if(state == 'unset') {
    return (
      <div className="flex h-screen w-full items-center justify-center px-4">
        <OASSelector />
      </div>
    )
  } else {
    return <div />
  }
}
