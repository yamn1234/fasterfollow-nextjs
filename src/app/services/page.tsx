import { Suspense } from "react";
import Services from "@/views/Services";

export const metadata = {
  title: "خدماتنا | فاستر فولو",
  description: "تصفح جميع خدماتنا المميزة من زيادة المتابعين واللايكات والتفاعلات بأفضل الأسعار وبضمان الجودة العالية.",
  openGraph: {
    title: "خدماتنا | فاستر فولو",
    description: "اطلع على قائمة خدمات منصات التواصل الاجتماعي المتاحة وبأقل الأسعار في السوق.",
    url: "https://fasterfollow.site/services",
  },
};

export default function Page() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>}>
      <Services />
    </Suspense>
  );
}
