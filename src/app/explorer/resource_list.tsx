import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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

        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Properties</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {results.map((resource) => (
                    <TableRow>
                        <TableCell>{resource.id}</TableCell>
                        <TableCell>{JSON.stringify(resource)}</TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
        </div>
    )
}