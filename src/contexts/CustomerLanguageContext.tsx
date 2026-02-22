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
  home: { ar: 'الرئيسية', en: 'Home' },
  services: { ar: 'الخدمات', en: 'Services' },
  blog: { ar: 'المدونة', en: 'Blog' },
  login: { ar: 'تسجيل الدخول', en: 'Login' },
  register: { ar: 'إنشاء حساب', en: 'Register' },
  logout: { ar: 'تسجيل الخروج', en: 'Logout' },
  dashboard: { ar: 'لوحة التحكم', en: 'Dashboard' },
  myAccount: { ar: 'حسابي', en: 'My Account' },
  
  // Auth
  email: { ar: 'البريد الإلكتروني', en: 'Email' },
  password: { ar: 'كلمة المرور', en: 'Password' },
  fullName: { ar: 'الاسم الكامل', en: 'Full Name' },
  confirmPassword: { ar: 'تأكيد كلمة المرور', en: 'Confirm Password' },
  forgotPassword: { ar: 'نسيت كلمة المرور؟', en: 'Forgot Password?' },
  noAccount: { ar: 'ليس لديك حساب؟', en: "Don't have an account?" },
  haveAccount: { ar: 'لديك حساب بالفعل؟', en: 'Already have an account?' },
  createAccount: { ar: 'إنشاء حساب جديد', en: 'Create New Account' },
  welcomeBack: { ar: 'مرحباً بعودتك', en: 'Welcome Back' },
  loginSubtitle: { ar: 'سجل دخولك للوصول إلى حسابك', en: 'Sign in to access your account' },
  registerSubtitle: { ar: 'أنشئ حسابك الآن وابدأ', en: 'Create your account and get started' },

  // Dashboard
  overview: { ar: 'نظرة عامة', en: 'Overview' },
  newOrder: { ar: 'طلب جديد', en: 'New Order' },
  myOrders: { ar: 'طلباتي', en: 'My Orders' },
  transactions: { ar: 'سجل العمليات', en: 'Transactions' },
  addBalance: { ar: 'شحن الرصيد', en: 'Add Balance' },
  coupon: { ar: 'كوبون', en: 'Coupon' },
  support: { ar: 'الدعم الفني', en: 'Support' },
  yourBalance: { ar: 'رصيدك', en: 'Your Balance' },
  selectCurrency: { ar: 'اختر العملة', en: 'Select Currency' },
  notifications: { ar: 'الإشعارات', en: 'Notifications' },
  noNotifications: { ar: 'لا توجد إشعارات', en: 'No notifications' },
  markAllRead: { ar: 'تحديد الكل كمقروء', en: 'Mark all as read' },
  profile: { ar: 'الملف الشخصي', en: 'Profile' },
  settings: { ar: 'الإعدادات', en: 'Settings' },
  search: { ar: 'بحث...', en: 'Search...' },
  
  // Orders
  orderId: { ar: 'رقم الطلب', en: 'Order ID' },
  service: { ar: 'الخدمة', en: 'Service' },
  quantity: { ar: 'الكمية', en: 'Quantity' },
  price: { ar: 'السعر', en: 'Price' },
  status: { ar: 'الحالة', en: 'Status' },
  date: { ar: 'التاريخ', en: 'Date' },
  link: { ar: 'الرابط', en: 'Link' },
  startCount: { ar: 'العدد الأولي', en: 'Start Count' },
  remains: { ar: 'المتبقي', en: 'Remains' },
  placeOrder: { ar: 'تقديم الطلب', en: 'Place Order' },
  orderPlaced: { ar: 'تم تقديم الطلب بنجاح', en: 'Order placed successfully' },
  selectCategory: { ar: 'اختر الفئة', en: 'Select Category' },
  selectService: { ar: 'اختر الخدمة', en: 'Select Service' },
  enterLink: { ar: 'أدخل الرابط', en: 'Enter Link' },
  enterQuantity: { ar: 'أدخل الكمية', en: 'Enter Quantity' },
  orderSummary: { ar: 'ملخص الطلب', en: 'Order Summary' },
  totalPrice: { ar: 'السعر الإجمالي', en: 'Total Price' },
  
  // Order Status
  pending: { ar: 'قيد الانتظار', en: 'Pending' },
  processing: { ar: 'جاري المعالجة', en: 'Processing' },
  inProgress: { ar: 'قيد التنفيذ', en: 'In Progress' },
  completed: { ar: 'مكتمل', en: 'Completed' },
  partial: { ar: 'جزئي', en: 'Partial' },
  cancelled: { ar: 'ملغي', en: 'Cancelled' },
  refunded: { ar: 'مسترد', en: 'Refunded' },
  failed: { ar: 'فشل', en: 'Failed' },
  
  // Balance & Payments
  chargeBalance: { ar: 'شحن الرصيد', en: 'Charge Balance' },
  paymentMethod: { ar: 'طريقة الدفع', en: 'Payment Method' },
  amount: { ar: 'المبلغ', en: 'Amount' },
  chargeNow: { ar: 'شحن الآن', en: 'Charge Now' },
  goToPayment: { ar: 'الانتقال للدفع', en: 'Go to Payment' },
  bonus: { ar: 'بونص', en: 'Bonus' },
  fees: { ar: 'رسوم', en: 'Fees' },
  total: { ar: 'الإجمالي', en: 'Total' },

  // Coupon
  useCoupon: { ar: 'استخدام كوبون', en: 'Use Coupon' },
  enterCouponCode: { ar: 'أدخل كود الكوبون', en: 'Enter Coupon Code' },
  couponCode: { ar: 'كود الكوبون', en: 'Coupon Code' },
  redeemCoupon: { ar: 'استخدام الكوبون', en: 'Redeem Coupon' },
  couponSuccess: { ar: 'تم شحن رصيدك بنجاح', en: 'Balance charged successfully' },
  invalidCoupon: { ar: 'الكوبون غير صالح', en: 'Invalid coupon' },
  couponExpired: { ar: 'انتهت صلاحية الكوبون', en: 'Coupon expired' },
  couponUsed: { ar: 'لقد استخدمت هذا الكوبون من قبل', en: 'You have already used this coupon' },
  couponInfo: { ar: 'معلومات مهمة', en: 'Important Info' },
  couponInfoText1: { ar: 'الكوبونات صالحة للاستخدام مرة واحدة فقط لكل حساب', en: 'Coupons can only be used once per account' },
  couponInfoText2: { ar: 'تحقق من تاريخ صلاحية الكوبون قبل الاستخدام', en: 'Check coupon expiry before use' },
  couponInfoText3: { ar: 'الرصيد المضاف سيظهر فوراً في حسابك', en: 'Balance will appear immediately' },
  couponInfoText4: { ar: 'في حال وجود مشكلة، تواصل مع الدعم الفني', en: 'Contact support if you have issues' },
  currentBalance: { ar: 'رصيدك الحالي', en: 'Current Balance' },
  chargeSuccess: { ar: 'تم الشحن بنجاح!', en: 'Charged Successfully!' },
  addedToBalance: { ar: 'تمت إضافة', en: 'Added' },
  toYourBalance: { ar: 'إلى رصيدك', en: 'to your balance' },
  useAnotherCoupon: { ar: 'استخدام كوبون آخر', en: 'Use Another Coupon' },
  verifying: { ar: 'جاري التحقق...', en: 'Verifying...' },

  // Transactions
  transactionHistory: { ar: 'سجل العمليات', en: 'Transaction History' },
  deposit: { ar: 'إيداع', en: 'Deposit' },
  purchase: { ar: 'شراء', en: 'Purchase' },
  refund: { ar: 'استرداد', en: 'Refund' },
  manual: { ar: 'يدوي', en: 'Manual' },
  referral: { ar: 'إحالة', en: 'Referral' },
  
  // Support
  createTicket: { ar: 'إنشاء تذكرة', en: 'Create Ticket' },
  subject: { ar: 'الموضوع', en: 'Subject' },
  message: { ar: 'الرسالة', en: 'Message' },
  priority: { ar: 'الأولوية', en: 'Priority' },
  low: { ar: 'منخفضة', en: 'Low' },
  medium: { ar: 'متوسطة', en: 'Medium' },
  high: { ar: 'عالية', en: 'High' },
  urgent: { ar: 'عاجلة', en: 'Urgent' },
  open: { ar: 'مفتوحة', en: 'Open' },
  closed: { ar: 'مغلقة', en: 'Closed' },
  reply: { ar: 'رد', en: 'Reply' },
  sendReply: { ar: 'إرسال الرد', en: 'Send Reply' },
  
  // Services
  minQuantity: { ar: 'الحد الأدنى', en: 'Min Quantity' },
  maxQuantity: { ar: 'الحد الأقصى', en: 'Max Quantity' },
  deliveryTime: { ar: 'وقت التسليم', en: 'Delivery Time' },
  orderNow: { ar: 'اطلب الآن', en: 'Order Now' },
  description: { ar: 'الوصف', en: 'Description' },
  rating: { ar: 'التقييم', en: 'Rating' },
  reviews: { ar: 'تقييم', en: 'reviews' },
  per1000: { ar: 'لكل 1000', en: 'per 1000' },
  
  // Common
  loading: { ar: 'جاري التحميل...', en: 'Loading...' },
  noData: { ar: 'لا توجد بيانات', en: 'No data' },
  save: { ar: 'حفظ', en: 'Save' },
  cancel: { ar: 'إلغاء', en: 'Cancel' },
  delete: { ar: 'حذف', en: 'Delete' },
  edit: { ar: 'تعديل', en: 'Edit' },
  view: { ar: 'عرض', en: 'View' },
  close: { ar: 'إغلاق', en: 'Close' },
  confirm: { ar: 'تأكيد', en: 'Confirm' },
  submit: { ar: 'إرسال', en: 'Submit' },
  all: { ar: 'الكل', en: 'All' },
  filter: { ar: 'تصفية', en: 'Filter' },
  refresh: { ar: 'تحديث', en: 'Refresh' },
  copy: { ar: 'نسخ', en: 'Copy' },
  copied: { ar: 'تم النسخ', en: 'Copied' },
  
  // Theme & Language
  darkMode: { ar: 'الوضع الداكن', en: 'Dark Mode' },
  lightMode: { ar: 'الوضع الفاتح', en: 'Light Mode' },
  language: { ar: 'اللغة', en: 'Language' },
  arabic: { ar: 'العربية', en: 'Arabic' },
  english: { ar: 'الإنجليزية', en: 'English' },
  
  // Homepage
  heroTitle: { ar: 'زد متابعينك بسرعة وأمان', en: 'Grow Your Followers Fast & Safe' },
  heroSubtitle: { ar: 'أفضل خدمات التواصل الاجتماعي بأسعار تنافسية', en: 'Best social media services at competitive prices' },
  startNow: { ar: 'ابدأ الآن', en: 'Start Now' },
  browseServices: { ar: 'تصفح الخدمات', en: 'Browse Services' },
  
  // Footer
  allRightsReserved: { ar: 'جميع الحقوق محفوظة', en: 'All Rights Reserved' },
  termsOfService: { ar: 'شروط الاستخدام', en: 'Terms of Service' },
  privacyPolicy: { ar: 'سياسة الخصوصية', en: 'Privacy Policy' },
  contactUs: { ar: 'تواصل معنا', en: 'Contact Us' },
  aboutUs: { ar: 'من نحن', en: 'About Us' },
  faq: { ar: 'الأسئلة الشائعة', en: 'FAQ' },
};

interface CustomerLanguageContextType {
  language: Language;
  direction: Direction;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
  toggleLanguage: () => void;
}

const CustomerLanguageContext = createContext<CustomerLanguageContextType | undefined>(undefined);

export const useCustomerLanguage = () => {
  const context = useContext(CustomerLanguageContext);
  if (!context) {
    throw new Error('useCustomerLanguage must be used within CustomerLanguageProvider');
  }
  return context;
};

export const CustomerLanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = (typeof window !== 'undefined' ? window.localStorage : null)?.getItem('customer-language');
    return (saved as Language) || 'ar';
  });

  const direction: Direction = language === 'ar' ? 'rtl' : 'ltr';

  useEffect(() => {
    (typeof window !== 'undefined' ? window.localStorage : null)?.setItem('customer-language', language);
    document.documentElement.dir = direction;
    document.documentElement.lang = language;
  }, [language, direction]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
  };

  const toggleLanguage = () => {
    setLanguageState(prev => prev === 'ar' ? 'en' : 'ar');
  };

  const t = (key: string): string => {
    return translations[key]?.[language] || key;
  };

  return (
    <CustomerLanguageContext.Provider value={{ language, direction, setLanguage, t, toggleLanguage }}>
      {children}
    </CustomerLanguageContext.Provider>
  );
};
