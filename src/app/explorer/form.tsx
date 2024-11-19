import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input";
import { useSpec } from "@/state/StateContext";
import { useMemo, } from "react";
import { useForm } from "react-hook-form";
import { useParams } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";

export default function CreateForm() {
    const { resourceId } = useParams();
    const { spec } = useSpec(); // Removed setSpec as it was not used

    const form = useForm();
    const navigate = useNavigate();

    const onSubmit = ((value) => {
        console.log("inside onsubmit");
        // Value is the properly formed JSON body.
        // Just need to submit it and navigate back to the list page.
        const resource_schema = spec?.resourceForName(resourceId);
        resource_schema.create(value).then(() => {
            toast({description: `Created ${value.id}`});
            navigate(`/explorer/${resource_schema.plural_name}`)
        })

    });

    const formBuilder = useMemo(() => {
        const resource_schema = spec?.resourceForName(resourceId);
        if(resource_schema) {
            return resource_schema?.properties().map((p) => {
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
        } else {
            return [];
        }
    }, [resourceId, spec, form.control]);

    return (
        <Form {...form}>
            <form>
                {formBuilder}
                <Button onClick={form.handleSubmit(onSubmit)} type="submit">Submit</Button>
            </form>
        </Form>
    )
}