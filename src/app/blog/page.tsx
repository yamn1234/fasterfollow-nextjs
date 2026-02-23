import { Suspense } from "react";
import Blog from "@/views/Blog";

export const metadata = {
  title: "المدونة | فاستر فولو",
  description: "أحدث المقالات والنصائح حول زيادة التفاعل وتكبير حسابات التواصل الاجتماعي والتسويق الرقمي.",
  openGraph: {
    title: "المدونة | فاستر فولو",
    description: "اكتشف أسرار وأدوات تصدر منصات السوشيال ميديا.",
    url: "https://fasterfollow.site/blog",
  },
};

export default function Page() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>}>
      <Blog />
    </Suspense>
  );
}
