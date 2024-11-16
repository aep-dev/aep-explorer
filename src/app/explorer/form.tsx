import { useSpec } from "@/state/StateContext";
import { useParams } from "react-router-dom";

export default function Form() {
    const { resourceId } = useParams();
    const { spec, setSpec } = useSpec();

    let resource_schema = spec?.resourceForName(resourceId);

    return (
        <div></div>
    )
}