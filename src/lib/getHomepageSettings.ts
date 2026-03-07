import { createClient } from "@supabase/supabase-js";
import {
    HomepageSection,
    HeroSettings,
    SiteSettings,
    ServicesSettings,
    PlatformsSettings,
    FeaturesSettings,
    CTASettings,
} from "@/hooks/useHomepageSettings";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

const defaultSections: HomepageSection[] = [
    { id: "hero", name: "Hero Section", name_ar: "القسم الرئيسي", enabled: true, order: 1 },
    { id: "features", name: "Features", name_ar: "المميزات", enabled: true, order: 2 },
    { id: "services", name: "Services", name_ar: "الخدمات", enabled: true, order: 3 },
    { id: "platforms", name: "Platforms", name_ar: "المنصات", enabled: true, order: 4 },
    { id: "cta", name: "Call to Action", name_ar: "دعوة للعمل", enabled: true, order: 5 },
];

const defaultHeroSettings: HeroSettings = {
    title: "زيادة متابعينك بسهولة",
    subtitle: "أفضل منصة لخدمات التواصل الاجتماعي",
    button_text: "ابدأ الآن",
    button_link: "/auth",
    show_stats: true,
    stats: {
        customers: "+10K",
        customers_label: "عميل سعيد",
        services: "+50",
        services_label: "خدمة متاحة",
        support: "24/7",
        support_label: "دعم فني",
    },
};

const defaultSiteSettings: SiteSettings = {
    site_name: "SMM Panel",
    site_name_ar: "متجر المتابعين",
    site_description:
        "نقدم لك أسهل وأبسط وأسرع خدمة لزيادة المتابعين والتفاعل على منصات التواصل الاجتماعي.",
};

const defaultServicesSettings: ServicesSettings = {
    title: "الخدمات",
    title_highlight: "الأكثر طلباً",
    subtitle: "اكتشف خدماتنا المميزة والأكثر شعبية بين عملائنا",
};

const defaultPlatformsSettings: PlatformsSettings = {
    title: "اختر",
    title_highlight: "منصتك المفضلة",
    subtitle: "نوفر خدمات لجميع منصات التواصل الاجتماعي الشهيرة بأسعار تنافسية وجودة عالية",
};

const defaultFeaturesSettings: FeaturesSettings = {
    title: "لماذا متجر المتابعين؟",
    subtitle: "نقدم لك تجربة فريدة ومميزة تجعلنا الخيار الأول لآلاف العملاء",
    features: [
        { icon: "Zap", title: "سرعة فائقة", description: "تبدأ الخدمة خلال دقائق من الطلب مع تسليم تدريجي طبيعي" },
        { icon: "Shield", title: "ضمان كامل", description: "نضمن جميع خدماتنا مع تعويض فوري في حالة النقص" },
        { icon: "DollarSign", title: "أسعار تنافسية", description: "أفضل الأسعار في السوق مع جودة عالية لا مثيل لها" },
        { icon: "Headphones", title: "دعم فني 24/7", description: "فريق دعم متخصص جاهز لمساعدتك في أي وقت" },
        { icon: "Gift", title: "هدايا مجانية", description: "احصل على رصيد مجاني عند كل شحن وخدمات مجانية" },
        { icon: "Clock", title: "تشغيل آلي", description: "نظام آلي متطور لبدء الخدمة فوراً بدون تأخير" },
    ],
};

const defaultCTASettings: CTASettings = {
    badge_text: "احصل على رصيد مجاني للتجربة",
    title: "ابدأ رحلتك نحو النجاح",
    subtitle: "على السوشيال ميديا",
    description: "سجل الآن واحصل على رصيد مجاني لتجربة جميع خدماتنا. لا يوجد حد أدنى للشحن!",
    button_text: "سجل الآن مجاناً",
    button_link: "/auth",
    stats: {
        customers: "+10,000",
        customers_label: "عميل نشط",
        orders: "+1M",
        orders_label: "طلب مكتمل",
        satisfaction: "99%",
        satisfaction_label: "رضا العملاء",
    },
};

export async function getHomepageSettings() {
    let newSections = [...defaultSections];
    let newHero = { ...defaultHeroSettings };
    let newSite = { ...defaultSiteSettings };
    let newServices = { ...defaultServicesSettings };
    let newPlatforms = { ...defaultPlatformsSettings };
    let newFeatures = { ...defaultFeaturesSettings };
    let newCTA = { ...defaultCTASettings };

    try {
        const { data } = await supabase
            .from("site_settings")
            .select("key, value")
            .in("key", [
                "homepage_sections",
                "hero_settings",
                "site_name",
                "site_name_ar",
                "site_description",
                "services_settings",
                "platforms_settings",
                "features_settings",
                "cta_settings",
            ]);

        if (data) {
            data.forEach((item) => {
                try {
                    let value = item.value;
                    if (typeof value === "string") {
                        try {
                            value = JSON.parse(value);
                        } catch {
                            // use as is
                        }
                    }

                    if (item.key === "homepage_sections" && Array.isArray(value)) {
                        newSections = value as unknown as HomepageSection[];
                    } else if (item.key === "hero_settings" && value && typeof value === "object" && !Array.isArray(value)) {
                        newHero = { ...newHero, ...(value as unknown as Partial<HeroSettings>) };
                    } else if (item.key === "services_settings" && value && typeof value === "object" && !Array.isArray(value)) {
                        newServices = { ...newServices, ...(value as unknown as Partial<ServicesSettings>) };
                    } else if (item.key === "platforms_settings" && value && typeof value === "object" && !Array.isArray(value)) {
                        newPlatforms = { ...newPlatforms, ...(value as unknown as Partial<PlatformsSettings>) };
                    } else if (item.key === "features_settings" && value && typeof value === "object" && !Array.isArray(value)) {
                        newFeatures = { ...newFeatures, ...(value as unknown as Partial<FeaturesSettings>) };
                    } else if (item.key === "cta_settings" && value && typeof value === "object" && !Array.isArray(value)) {
                        newCTA = { ...newCTA, ...(value as unknown as Partial<CTASettings>) };
                    } else if (item.key === "site_name" && value) {
                        newSite.site_name = String(value);
                    } else if (item.key === "site_name_ar" && value) {
                        newSite.site_name_ar = String(value);
                    } else if (item.key === "site_description" && value) {
                        newSite.site_description = String(value);
                    }
                } catch (e) {
                    console.warn("Error parsing setting server-side:", item.key, e);
                }
            });
        }
    } catch (error) {
        console.error("Error loading homepage settings server-side:", error);
    }

    return {
        sections: newSections,
        heroSettings: newHero,
        siteSettings: newSite,
        servicesSettings: newServices,
        platformsSettings: newPlatforms,
        featuresSettings: newFeatures,
        ctaSettings: newCTA,
    };
}
