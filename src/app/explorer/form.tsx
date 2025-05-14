import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input";
import { useMemo, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import { useAppSelector } from "@/hooks/store";
import { selectHeaders } from "@/state/store";
import { ResourceSchema } from "@/state/openapi";

type CreateFormProps = {
    resource: ResourceSchema
}

export default function CreateForm(props: CreateFormProps) {
    const form = useForm();
    const params = useParams();
    const navigate = useNavigate();

    const headers = useAppSelector(selectHeaders);

    const onSubmit = ((value) => {
        // Value is the properly formed JSON body.
        // Just need to submit it and navigate back to the list page.
        props.resource.create(value, headers).then(() => {
            toast({description: `Created new resource`});
            navigate(-1);
        })

    });

    const formBuilder = useMemo(() => {
            return props.resource.properties().map((p) => {
                if (!p) {
                    return (<div>Loading...</div>)
                }
                return (
                    <FormField
                        control={form.control}
                        name={p.name}
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>{p.name}</FormLabel>
                                <FormControl>
                                    <Input {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                )
            });
    }, [props, form.control]);

    useEffect(() => {
        // Set parent parameters from URL params, excluding resourceId
        const parentParams = new Map<string, string>();
        for (const [key, value] of Object.entries(params)) {
            if (key !== 'resourceId' && value) {
                parentParams.set(key, value);
            }
        }
        props.resource.parents = parentParams;
    }, [params, props.resource])

    return (
        <Form {...form}>
            <form>
                {formBuilder}
                <Button onClick={form.handleSubmit(onSubmit)} type="submit">Submit</Button>
            </form>
        </Form>
    )
}