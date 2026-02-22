import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, CreditCard, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Gateway {
  id: string;
  name: string;
  slug: string;
  is_active: boolean;
  gateway_type: string | null;
  sort_order: number | null;
}

interface SortableGatewayProps {
  gateway: Gateway;
}

const SortableGateway = ({ gateway }: SortableGatewayProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: gateway.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-3 p-3 rounded-lg border bg-card ${
        isDragging ? "opacity-50 shadow-lg" : ""
      }`}
    >
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing p-1 hover:bg-muted rounded"
      >
        <GripVertical className="h-5 w-5 text-muted-foreground" />
      </button>
      <div className="p-2 rounded-lg bg-primary/10">
        <CreditCard className="h-4 w-4 text-primary" />
      </div>
      <div className="flex-1">
        <p className="font-medium">{gateway.name}</p>
        <p className="text-xs text-muted-foreground">
          {gateway.gateway_type === 'manual' ? 'يدوي' : 'تلقائي'}
        </p>
      </div>
      <div className={`w-2 h-2 rounded-full ${gateway.is_active ? 'bg-green-500' : 'bg-gray-400'}`} />
    </div>
  );
};

interface GatewaySortDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  gateways: Gateway[];
  onSorted: () => void;
}

const GatewaySortDialog = ({
  open,
  onOpenChange,
  gateways,
  onSorted,
}: GatewaySortDialogProps) => {
  const [sortedGateways, setSortedGateways] = useState<Gateway[]>([]);
  const [saving, setSaving] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    if (open) {
      const sorted = [...gateways].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
      setSortedGateways(sorted);
    }
  }, [open, gateways]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setSortedGateways((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const updates = sortedGateways.map((gateway, index) => ({
        id: gateway.id,
        sort_order: index,
      }));

      for (const update of updates) {
        const { error } = await supabase
          .from("payment_gateways")
          .update({ sort_order: update.sort_order })
          .eq("id", update.id);

        if (error) throw error;
      }

      toast.success("تم حفظ الترتيب بنجاح");
      onSorted();
      onOpenChange(false);
    } catch (error) {
      console.error("Error saving sort order:", error);
      toast.error("حدث خطأ في حفظ الترتيب");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>ترتيب طرق الدفع</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          اسحب وأفلت طرق الدفع لتغيير ترتيبها في صفحة شحن الرصيد
        </p>
        <div className="flex-1 overflow-y-auto space-y-2 py-4">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={sortedGateways.map((g) => g.id)}
              strategy={verticalListSortingStrategy}
            >
              {sortedGateways.map((gateway) => (
                <SortableGateway key={gateway.id} gateway={gateway} />
              ))}
            </SortableContext>
          </DndContext>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            إلغاء
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin ml-2" />
                جاري الحفظ...
              </>
            ) : (
              "حفظ الترتيب"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default GatewaySortDialog;
