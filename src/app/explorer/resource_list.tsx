import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useSpec } from "@/state/StateContext";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

export default function ResourceList() {
    const { resourceId } = useParams();
    const { spec, setSpec } = useSpec();

    const [results, setResults] = useState([{"id": "Loading..."}]);

    useEffect(() => {
        if (spec && resourceId) {
            spec!.resourceForName(resourceId).list().then((resources) => {
                console.log(resources);
                if(resources) {
                    setResults(resources.results);
                }
            });
        }
    }, [spec, resourceId]);


    return (
        <div>
            <h1>{resourceId}</h1>

        {results.map((resource) => (
            <Card>
            <CardHeader>
                <CardTitle>{resource.id}</CardTitle>
            </CardHeader>
            <CardContent>
                <p>{JSON.stringify(resource)}</p>
            </CardContent>
            </Card>
        ))}
        </div>
    )
}