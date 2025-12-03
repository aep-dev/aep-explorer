import { Settings } from "@/components/settings";
import { useAppSelector } from "@/hooks/store";
import { schemaState } from "@/state/store";

export default function SpecSpecifierPage() {
  return (
    <div className="flex h-screen w-full items-center justify-center px-4">
      <Settings />
    </div>
  )
}
