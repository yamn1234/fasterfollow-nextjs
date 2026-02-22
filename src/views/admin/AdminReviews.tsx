import { useState, useEffect } from 'react';
import {
  Star,
  Search,
  Check,
  X,
  Loader2,
  MessageSquare,
  User,
  Filter,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  is_approved: boolean;
  is_rejected: boolean;
  admin_note: string | null;
  created_at: string;
  user: {
    full_name: string | null;
  } | null;
  service: {
    name: string;
    name_ar: string | null;
  } | null;
}

const AdminReviews = () => {
  const { toast } = useToast();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('pending');
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [adminNote, setAdminNote] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    fetchReviews();
  }, [statusFilter]);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('reviews')
        .select(`
          id, rating, comment, is_approved, is_rejected, admin_note, created_at, user_id,
          service:services ( name, name_ar )
        `)
        .order('created_at', { ascending: false });

      if (statusFilter === 'pending') {
        query = query.eq('is_approved', false).eq('is_rejected', false);
      } else if (statusFilter === 'approved') {
        query = query.eq('is_approved', true);
      } else if (statusFilter === 'rejected') {
        query = query.eq('is_rejected', true);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Fetch profiles manually to join since there is no direct FK
      const userIds = [...new Set((data || []).map((r) => r.user_id))].filter(Boolean);

      let profilesData: any[] = [];
      if (userIds.length > 0) {
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('user_id, full_name')
          .in('user_id', userIds);

        if (!profilesError) {
          profilesData = profiles || [];
        }
      }

      const formattedReviews = (data || []).map((review: any) => {
        const matchingProfile = profilesData.find(p => p.user_id === review.user_id);
        return {
          ...review,
          user: matchingProfile ? { full_name: matchingProfile.full_name } : null
        };
      });

      setReviews(formattedReviews);
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (review: Review) => {
    setIsProcessing(true);
    try {
      const { error } = await supabase
        .from('reviews')
        .update({
          is_approved: true,
          is_rejected: false,
          admin_note: adminNote || null,
        })
        .eq('id', review.id);

      if (error) throw error;

      toast({
        title: 'تمت الموافقة',
        description: 'تم نشر التقييم بنجاح',
      });

      setSelectedReview(null);
      setAdminNote('');
      fetchReviews();
    } catch (error: any) {
      toast({
        title: 'خطأ',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async (review: Review) => {
    if (!adminNote.trim()) {
      toast({
        title: 'مطلوب',
        description: 'يرجى كتابة سبب الرفض',
        variant: 'destructive',
      });
      return;
    }

    setIsProcessing(true);
    try {
      const { error } = await supabase
        .from('reviews')
        .update({
          is_approved: false,
          is_rejected: true,
          admin_note: adminNote,
        })
        .eq('id', review.id);

      if (error) throw error;

      toast({
        title: 'تم الرفض',
        description: 'تم رفض التقييم',
      });

      setSelectedReview(null);
      setAdminNote('');
      fetchReviews();
    } catch (error: any) {
      toast({
        title: 'خطأ',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDelete = async (reviewId: string) => {
    try {
      const { error } = await supabase.from('reviews').delete().eq('id', reviewId);

      if (error) throw error;

      toast({
        title: 'تم الحذف',
        description: 'تم حذف التقييم',
      });

      fetchReviews();
    } catch (error: any) {
      toast({
        title: 'خطأ',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const renderStars = (rating: number) => {
    return [...Array(5)].map((_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${i < rating ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'
          }`}
      />
    ));
  };

  const filteredReviews = reviews.filter((review) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      review.user?.full_name?.toLowerCase().includes(query) ||
      review.service?.name?.toLowerCase().includes(query) ||
      review.service?.name_ar?.toLowerCase().includes(query) ||
      review.comment?.toLowerCase().includes(query)
    );
  });

  const getStatusBadge = (review: Review) => {
    if (review.is_approved) {
      return <Badge className="bg-green-500">منشور</Badge>;
    }
    if (review.is_rejected) {
      return <Badge variant="destructive">مرفوض</Badge>;
    }
    return <Badge variant="secondary">في الانتظار</Badge>;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">إدارة التقييمات</h1>
        <p className="text-muted-foreground">مراجعة والموافقة على تقييمات العملاء</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-500/10 rounded-lg">
                <Star className="w-5 h-5 text-yellow-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {reviews.filter((r) => !r.is_approved && !r.is_rejected).length}
                </p>
                <p className="text-sm text-muted-foreground">في الانتظار</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/10 rounded-lg">
                <Check className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {reviews.filter((r) => r.is_approved).length}
                </p>
                <p className="text-sm text-muted-foreground">منشور</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-500/10 rounded-lg">
                <X className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {reviews.filter((r) => r.is_rejected).length}
                </p>
                <p className="text-sm text-muted-foreground">مرفوض</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="ابحث عن تقييم..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pr-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-48">
                <Filter className="w-4 h-4 ml-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">في الانتظار</SelectItem>
                <SelectItem value="approved">منشور</SelectItem>
                <SelectItem value="rejected">مرفوض</SelectItem>
                <SelectItem value="all">الكل</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Reviews Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : filteredReviews.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>لا توجد تقييمات</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>المستخدم</TableHead>
                  <TableHead>الخدمة</TableHead>
                  <TableHead>التقييم</TableHead>
                  <TableHead>التعليق</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead>التاريخ</TableHead>
                  <TableHead>الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredReviews.map((review) => (
                  <TableRow key={review.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-muted-foreground" />
                        <span>{review.user?.full_name || 'مستخدم'}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {review.service?.name_ar || review.service?.name || '-'}
                    </TableCell>
                    <TableCell>
                      <div className="flex">{renderStars(review.rating)}</div>
                    </TableCell>
                    <TableCell>
                      <p className="max-w-xs truncate">{review.comment || '-'}</p>
                    </TableCell>
                    <TableCell>{getStatusBadge(review)}</TableCell>
                    <TableCell>
                      {new Date(review.created_at).toLocaleDateString('ar-SA')}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {!review.is_approved && !review.is_rejected && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-green-500"
                              onClick={() => {
                                setSelectedReview(review);
                                setAdminNote('');
                              }}
                            >
                              <Check className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-red-500"
                              onClick={() => {
                                setSelectedReview(review);
                                setAdminNote('');
                              }}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-destructive"
                          onClick={() => handleDelete(review.id)}
                        >
                          حذف
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Review Action Dialog */}
      <Dialog open={!!selectedReview} onOpenChange={() => setSelectedReview(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>مراجعة التقييم</DialogTitle>
            <DialogDescription>
              قم بالموافقة أو رفض هذا التقييم
            </DialogDescription>
          </DialogHeader>

          {selectedReview && (
            <div className="space-y-4 py-4">
              <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">المستخدم:</span>
                  <span className="font-medium">
                    {selectedReview.user?.full_name || 'مستخدم'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">الخدمة:</span>
                  <span className="font-medium">
                    {selectedReview.service?.name_ar || selectedReview.service?.name}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">التقييم:</span>
                  <div className="flex">{renderStars(selectedReview.rating)}</div>
                </div>
                {selectedReview.comment && (
                  <div>
                    <span className="text-sm text-muted-foreground">التعليق:</span>
                    <p className="mt-1">{selectedReview.comment}</p>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">ملاحظة الأدمن (اختياري للموافقة، مطلوب للرفض)</label>
                <Textarea
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                  placeholder="أدخل ملاحظتك هنا..."
                  rows={3}
                />
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setSelectedReview(null)}>
              إلغاء
            </Button>
            <Button
              variant="destructive"
              onClick={() => selectedReview && handleReject(selectedReview)}
              disabled={isProcessing}
            >
              {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4 ml-2" />}
              رفض
            </Button>
            <Button
              onClick={() => selectedReview && handleApprove(selectedReview)}
              disabled={isProcessing}
            >
              {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4 ml-2" />}
              موافقة
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminReviews;
