import { Card, CardContent } from "@/components/ui/card";
import { Hammer } from "lucide-react";

interface AdminComingSoonProps {
    title: string;
}

export default function AdminComingSoon({ title }: AdminComingSoonProps) {
    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold">{title}</h1>
                    <p className="text-muted-foreground">هذه الصفحة قيد التطوير</p>
                </div>
            </div>

            <Card className="mt-8 border-dashed border-2">
                <CardContent className="flex flex-col items-center justify-center p-16 text-center space-y-4">
                    <div className="p-4 rounded-full bg-primary/10">
                        <Hammer className="w-12 h-12 text-primary" />
                    </div>
                    <h2 className="text-xl font-semibold">قريباً!</h2>
                    <p className="text-muted-foreground max-w-sm">
                        نحن نعمل بجد لإضافة ميزات {title} المتقدمة. ستتوفر هذه الواجهة قريباً.
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
