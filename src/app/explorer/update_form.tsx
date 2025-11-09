import { Spinner } from "@/components/ui/spinner";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import { useAppSelector } from "@/hooks/store";
import { selectHeaders } from "@/state/store";
import { ResourceInstance } from "@/state/fetch";
import { ResourceSchema } from "@/state/openapi";
import { Form } from "@/components/form/form";

type UpdatePageProps = {
    schema: ResourceSchema
}

export default function UpdatePage(props: UpdatePageProps) {
    const [resourceInstance, setResourceInstance] = useState<ResourceInstance | null>(null);
    const { resourceId } = useParams();
    const navigate = useNavigate();
    const headers = useAppSelector(selectHeaders);
    const params = useParams();

    const parentParams = useMemo(() => {
        const parentMap = new Map<string, string>();
        for (const [key, value] of Object.entries(params)) {
            if (key !== 'resourceId' && value) {
                parentMap.set(key, value);
            }
        }
        return parentMap;
    }, [params]);

    useEffect(() => {
        props.schema.get(resourceId!).then((instance) => setResourceInstance(instance));
    }, [resourceId, props.schema])

    const handleSuccess = () => {
        toast({ description: `Updated ${resourceInstance?.properties['id']}` });
        navigate(-1);
    };

    const handleError = (error: unknown) => {
        // Error handling is already done in the fetch layer (handleResponse)
        // This catch prevents unhandled promise rejections
        console.error('Form submission failed:', error);
    };

    if (resourceInstance) {
        return (
            <Form
                resource={props.schema}
                resourceInstance={resourceInstance}
                parentParams={parentParams}
                headers={headers}
                onSuccess={handleSuccess}
                onError={handleError}
                onSubmitOperation={(value) => resourceInstance.update(value, headers)}
            />
        );
    } else {
        return <Spinner />
    }
}