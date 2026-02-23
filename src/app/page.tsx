import { Suspense } from "react";
import Index from "@/views/Index";

export const metadata = {
  title: "الرئيسية | فاستر فولو - اسرع موقع رشق متابعين",
  description: "فاستر فولو هو الخيار الأول لزيادة متابعين ولايكات منصات التواصل الاجتماعي بأرخص الأسعار مع ضمان التنفيذ السريع.",
  openGraph: {
    title: "الرئيسية | فاستر فولو",
    description: "أفضل وأسرع منصة لزيادة وتكبير حسابات التواصل الاجتماعي.",
    url: "https://fasterfollow.net",
    siteName: "FasterFollow",
    locale: "ar_SA",
    type: "website",
  },
};

export default function Page() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>}>
      <Index />
    </Suspense>
  );
}
