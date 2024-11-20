import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input";
import { useMemo, } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";

type CreateFormProps = {
    resource: ResourceSchema
}

export default function CreateForm(props: CreateFormProps) {
    const form = useForm();
    const navigate = useNavigate();

    const onSubmit = ((value) => {
        // Value is the properly formed JSON body.
        // Just need to submit it and navigate back to the list page.
        props.resource.create(value).then(() => {
            toast({description: `Created ${value.id}`});
            navigate(`/${props.resource.base_url()}`)
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

    return (
        <Form {...form}>
            <form>
                {formBuilder}
                <Button onClick={form.handleSubmit(onSubmit)} type="submit">Submit</Button>
            </form>
        </Form>
    )
}