import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Language = 'ar' | 'en';
type Direction = 'rtl' | 'ltr';

interface Translations {
  [key: string]: {
    ar: string;
    en: string;
  };
}

const translations: Translations = {
  // General
  dashboard: { ar: 'لوحة التحكم', en: 'Dashboard' },
  admin: { ar: 'الإدارة', en: 'Admin' },
  home: { ar: 'الرئيسية', en: 'Home' },
  save: { ar: 'حفظ', en: 'Save' },
  cancel: { ar: 'إلغاء', en: 'Cancel' },
  delete: { ar: 'حذف', en: 'Delete' },
  edit: { ar: 'تعديل', en: 'Edit' },
  add: { ar: 'إضافة', en: 'Add' },
  search: { ar: 'بحث', en: 'Search' },
  filter: { ar: 'تصفية', en: 'Filter' },
  export: { ar: 'تصدير', en: 'Export' },
  import: { ar: 'استيراد', en: 'Import' },
  actions: { ar: 'إجراءات', en: 'Actions' },
  status: { ar: 'الحالة', en: 'Status' },
  active: { ar: 'نشط', en: 'Active' },
  inactive: { ar: 'غير نشط', en: 'Inactive' },
  archived: { ar: 'مؤرشف', en: 'Archived' },
  loading: { ar: 'جاري التحميل...', en: 'Loading...' },
  noData: { ar: 'لا توجد بيانات', en: 'No data' },
  success: { ar: 'تم بنجاح', en: 'Success' },
  error: { ar: 'خطأ', en: 'Error' },
  
  // Sidebar
  overview: { ar: 'نظرة عامة', en: 'Overview' },
  users: { ar: 'المستخدمين', en: 'Users' },
  orders: { ar: 'الطلبات', en: 'Orders' },
  services: { ar: 'الخدمات', en: 'Services' },
  providers: { ar: 'المزودين', en: 'Providers' },
  payments: { ar: 'المدفوعات', en: 'Payments' },
  content: { ar: 'المحتوى', en: 'Content' },
  blog: { ar: 'المدونة', en: 'Blog' },
  settings: { ar: 'الإعدادات', en: 'Settings' },
  reports: { ar: 'التقارير', en: 'Reports' },
  support: { ar: 'الدعم', en: 'Support' },
  
  // Stats
  totalUsers: { ar: 'إجمالي المستخدمين', en: 'Total Users' },
  totalOrders: { ar: 'إجمالي الطلبات', en: 'Total Orders' },
  totalRevenue: { ar: 'إجمالي الإيرادات', en: 'Total Revenue' },
  pendingOrders: { ar: 'طلبات معلقة', en: 'Pending Orders' },
  todayOrders: { ar: 'طلبات اليوم', en: "Today's Orders" },
  monthlyRevenue: { ar: 'إيرادات الشهر', en: 'Monthly Revenue' },
  
  // Users
  userName: { ar: 'اسم المستخدم', en: 'Username' },
  email: { ar: 'البريد الإلكتروني', en: 'Email' },
  balance: { ar: 'الرصيد', en: 'Balance' },
  role: { ar: 'الدور', en: 'Role' },
  joinDate: { ar: 'تاريخ الانضمام', en: 'Join Date' },
  lastLogin: { ar: 'آخر تسجيل دخول', en: 'Last Login' },
  
  // Orders
  orderId: { ar: 'رقم الطلب', en: 'Order ID' },
  service: { ar: 'الخدمة', en: 'Service' },
  quantity: { ar: 'الكمية', en: 'Quantity' },
  price: { ar: 'السعر', en: 'Price' },
  link: { ar: 'الرابط', en: 'Link' },
  startCount: { ar: 'العدد الأولي', en: 'Start Count' },
  remains: { ar: 'المتبقي', en: 'Remains' },
  
  // Order Status
  pending: { ar: 'قيد الانتظار', en: 'Pending' },
  processing: { ar: 'جاري المعالجة', en: 'Processing' },
  inProgress: { ar: 'قيد التنفيذ', en: 'In Progress' },
  completed: { ar: 'مكتمل', en: 'Completed' },
  partial: { ar: 'جزئي', en: 'Partial' },
  cancelled: { ar: 'ملغي', en: 'Cancelled' },
  refunded: { ar: 'مسترد', en: 'Refunded' },
  failed: { ar: 'فشل', en: 'Failed' },
  
  // Services
  serviceName: { ar: 'اسم الخدمة', en: 'Service Name' },
  category: { ar: 'الفئة', en: 'Category' },
  minQuantity: { ar: 'الحد الأدنى', en: 'Min Quantity' },
  maxQuantity: { ar: 'الحد الأقصى', en: 'Max Quantity' },
  provider: { ar: 'المزود', en: 'Provider' },
  
  // SEO
  seoSettings: { ar: 'إعدادات SEO', en: 'SEO Settings' },
  seoTitle: { ar: 'عنوان SEO', en: 'SEO Title' },
  seoDescription: { ar: 'وصف SEO', en: 'SEO Description' },
  seoKeywords: { ar: 'كلمات مفتاحية', en: 'Keywords' },
  canonicalUrl: { ar: 'الرابط الكنسي', en: 'Canonical URL' },
  indexable: { ar: 'قابل للفهرسة', en: 'Indexable' },
  
  // Auth
  login: { ar: 'تسجيل الدخول', en: 'Login' },
  logout: { ar: 'تسجيل الخروج', en: 'Logout' },
  password: { ar: 'كلمة المرور', en: 'Password' },
  rememberMe: { ar: 'تذكرني', en: 'Remember Me' },
  forgotPassword: { ar: 'نسيت كلمة المرور؟', en: 'Forgot Password?' },
  
  // Admin Panel
  adminPanel: { ar: 'لوحة الإدارة', en: 'Admin Panel' },
  userManagement: { ar: 'إدارة المستخدمين', en: 'User Management' },
  serviceManagement: { ar: 'إدارة الخدمات', en: 'Service Management' },
  orderManagement: { ar: 'إدارة الطلبات', en: 'Order Management' },
  paymentManagement: { ar: 'إدارة المدفوعات', en: 'Payment Management' },
  contentManagement: { ar: 'إدارة المحتوى', en: 'Content Management' },
  blogManagement: { ar: 'إدارة المدونة', en: 'Blog Management' },
  systemSettings: { ar: 'إعدادات النظام', en: 'System Settings' },
  
  // Messages
  confirmDelete: { ar: 'هل أنت متأكد من الحذف؟', en: 'Are you sure you want to delete?' },
  savedSuccessfully: { ar: 'تم الحفظ بنجاح', en: 'Saved successfully' },
  deletedSuccessfully: { ar: 'تم الحذف بنجاح', en: 'Deleted successfully' },
  errorOccurred: { ar: 'حدث خطأ', en: 'An error occurred' },
  unauthorized: { ar: 'غير مصرح', en: 'Unauthorized' },
  accessDenied: { ar: 'تم رفض الوصول', en: 'Access Denied' },
};

interface LanguageContextType {
  language: Language;
  direction: Direction;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
};

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = (typeof window !== 'undefined' ? window.localStorage : null)?.getItem('admin-language');
    return (saved as Language) || 'ar';
  });

  const direction: Direction = language === 'ar' ? 'rtl' : 'ltr';

  useEffect(() => {
    (typeof window !== 'undefined' ? window.localStorage : null)?.setItem('admin-language', language);
    document.documentElement.dir = direction;
    document.documentElement.lang = language;
  }, [language, direction]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
  };

  const t = (key: string): string => {
    return translations[key]?.[language] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, direction, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};
