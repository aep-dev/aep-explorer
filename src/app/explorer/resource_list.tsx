import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Plus, RefreshCw } from "lucide-react";
import { ResourceSchema } from "@/state/openapi";
import { ResourceInstance } from "@/state/fetch";
import { selectHeaders } from "@/state/store";
import { useAppSelector } from "@/hooks/store";
import { ResourceListTable } from "@/components/resource_list";

type ResourceListState = {
    resources: ResourceInstance[],
}

type ResourceListProps = {
    resource: ResourceSchema
}

export default function ResourceListPage(props: ResourceListProps) {
    const navigate = useNavigate();
    const [state, setState] = useState<ResourceListState>({
        resources: [],
    });

    const headers = useAppSelector(selectHeaders);

    const refreshList = useCallback(() => {
        props.resource
            .list(headers)
            .then((resources) => {
                if (resources) {
                    setState({
                        resources: resources,
                    });
                }
            });
    }, [props, headers]);

    useEffect(() => {
        refreshList();
    }, [props, refreshList]);

    return (
        <div>
            <div className="flex items-center justify-between mb-4">
                <h1>{props.resource.plural_name.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}</h1>
                <div className="flex gap-2">
                    <Button variant="outline" size="icon" onClick={() => navigate("_create")}>
                        <Plus className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="icon" onClick={refreshList}>
                        <RefreshCw className="h-4 w-4" />
                    </Button>
                </div>
            </div>
            <ResourceListTable 
                resource={props.resource}
                resources={state.resources}
                onRefresh={refreshList}
            />
        </div>
    );
}
