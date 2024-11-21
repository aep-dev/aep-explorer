import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input";
import { useEffect, useMemo, useState, } from "react";
import { useForm } from "react-hook-form";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import { ResourceInstance } from "@/state/fetch";
import { ResourceSchema } from "@/state/openapi";

type UpdateFormProps = {
    schema: ResourceSchema
}

export default function UpdateForm(props: UpdateFormProps) {
    const [state, setState] = useState<ResourceInstance>(null);
    const {resourceId} = useParams();

    useEffect(() => {
        props.schema.get(resourceId!).then((instance) => setState(instance));
    }, [resourceId, props.schema])

    if(state) {
        return <UpdateFormInner resource={state} schema={props.schema} />
    } else {
        return <div>Loading...</div>
    }
}

type UpdateFormInnerProps = {
    resource: ResourceInstance
    schema: ResourceSchema
}

function UpdateFormInner(props: UpdateFormInnerProps) {
    const form = useForm();
    const navigate = useNavigate();

    const onSubmit = ((value) => {
        // Value is the properly formed JSON body.
        // Just need to submit it and navigate back to the list page.
        props.resource.update(value).then(() => {
            toast({description: `Updated ${props.resource.properties['id']}`});
            navigate(-1);
        })

    });

    const formBuilder = useMemo(() => {
            return props.resource.schema.properties().map((p) => {
                if (!p) {
                    return (<div>Loading...</div>)
                }
                let defaultValue = "";
                if(props.resource.properties[p.name]) {
                    defaultValue = props.resource.properties[p.name];
                }
                return (
                    <FormField
                        control={form.control}
                        name={p.name}
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>{p.name}</FormLabel>
                                <FormControl>
                                    <Input defaultValue={defaultValue} {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                )
            });
    }, [props, form.control]);

    return (
        <Form {...form}>
            <form>
                {formBuilder}
                <Button onClick={form.handleSubmit(onSubmit)} type="submit">Submit</Button>
            </form>
        </Form>
    )
}