import { useEffect, useMemo, useState, } from "react";
import { useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ResourceInstance } from "@/state/fetch";
import { ResourceSchema } from "@/state/openapi";

type InfoPageProps = {
    resource: ResourceSchema
}

export default function InfoPage(props: InfoPageProps) {
    const { resourceId }= useParams();
    const [state, setState] = useState<ResourceInstance>({});

    useEffect(() => {
        props.resource.get(resourceId!).then((instance) => setState(instance));
    }, [resourceId, props.resource])

    const properties = useMemo(() => {
            if(state.properties) {
                let results = [];
                for (const [key, value] of Object.entries(state.properties)) {
                    results.push(<p>
                        <b>{key}:</b> {value}
                    </p>)
                }
                return results;
            }
            return <p>Loading...</p>
    }, [state]);

    return (
        <Card>
        <CardHeader>
            <CardTitle>{state.properties?.path}</CardTitle>
        </CardHeader>
        <CardContent>
            {properties}
        </CardContent>
        </Card>
    )
}