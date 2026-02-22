import { useState, useEffect } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Category {
  id: string;
  name: string;
  name_ar: string | null;
}

interface Service {
  id: string;
  name: string;
  name_ar: string | null;
  price: number;
  sort_order: number;
  is_active: boolean;
}

interface SortableItemProps {
  service: Service;
  index: number;
}

const SortableItem = ({ service, index }: SortableItemProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: service.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 1 : 0,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-3 p-3 bg-card border rounded-lg ${
        isDragging ? 'shadow-lg opacity-90' : ''
      }`}
    >
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing p-1 hover:bg-muted rounded"
      >
        <GripVertical className="w-5 h-5 text-muted-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-muted-foreground w-6">
            {index + 1}
          </span>
          <span className="font-medium truncate">{service.name}</span>
        </div>
        {service.name_ar && (
          <p className="text-sm text-muted-foreground truncate mr-8">
            {service.name_ar}
          </p>
        )}
      </div>
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">${service.price}</span>
        <Badge variant={service.is_active ? 'default' : 'secondary'}>
          {service.is_active ? 'نشط' : 'غير نشط'}
        </Badge>
      </div>
    </div>
  );
};

interface ServiceSortDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: Category[];
  onSortComplete: () => void;
}

const ServiceSortDialog = ({
  open,
  onOpenChange,
  categories,
  onSortComplete,
}: ServiceSortDialogProps) => {
  const { toast } = useToast();
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    if (selectedCategory) {
      fetchServices();
    } else {
      setServices([]);
    }
  }, [selectedCategory]);

  const fetchServices = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('services')
        .select('id, name, name_ar, price, sort_order, is_active')
        .eq('category_id', selectedCategory)
        .eq('is_archived', false)
        .order('sort_order', { ascending: true });

      if (error) throw error;
      setServices(data || []);
      setHasChanges(false);
    } catch (error) {
      console.error('Error fetching services:', error);
      toast({
        title: 'خطأ',
        description: 'حدث خطأ في جلب الخدمات',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setServices((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
      setHasChanges(true);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Update sort_order for all services
      const updates = services.map((service, index) => ({
        id: service.id,
        sort_order: index,
      }));

      for (const update of updates) {
        const { error } = await supabase
          .from('services')
          .update({ sort_order: update.sort_order })
          .eq('id', update.id);

        if (error) throw error;
      }

      toast({
        title: 'تم بنجاح',
        description: 'تم حفظ ترتيب الخدمات',
      });

      setHasChanges(false);
      onSortComplete();
    } catch (error: any) {
      toast({
        title: 'خطأ',
        description: error.message || 'حدث خطأ في حفظ الترتيب',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    setSelectedCategory('');
    setServices([]);
    setHasChanges(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>ترتيب الخدمات</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger>
              <SelectValue placeholder="اختر التصنيف" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>
                  {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {loading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : services.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              {selectedCategory
                ? 'لا توجد خدمات في هذا التصنيف'
                : 'اختر تصنيف لعرض الخدمات'}
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              <p className="text-sm text-muted-foreground mb-2">
                اسحب وأفلت لتغيير الترتيب
              </p>
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={services.map((s) => s.id)}
                  strategy={verticalListSortingStrategy}
                >
                  {services.map((service, index) => (
                    <SortableItem
                      key={service.id}
                      service={service}
                      index={index}
                    />
                  ))}
                </SortableContext>
              </DndContext>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={handleClose}>
            إغلاق
          </Button>
          <Button
            onClick={handleSave}
            disabled={!hasChanges || saving}
            className="gradient-primary text-primary-foreground"
          >
            {saving && <Loader2 className="w-4 h-4 ml-2 animate-spin" />}
            حفظ الترتيب
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ServiceSortDialog;
