import { useState, useEffect, useCallback } from 'react';

export interface Currency {
  code: string;
  symbol: string;
  name: string;
  rate: number;
  flag: string;
}

export const currencies: Currency[] = [
  // العملات الأساسية
  { code: "USD", symbol: "$", name: "دولار أمريكي", rate: 1, flag: "🇺🇸" },
  { code: "EUR", symbol: "€", name: "يورو", rate: 0.92, flag: "🇪🇺" },
  { code: "GBP", symbol: "£", name: "جنيه إسترليني", rate: 0.79, flag: "🇬🇧" },
  // دول الخليج
  { code: "SAR", symbol: "ر.س", name: "ريال سعودي", rate: 3.75, flag: "🇸🇦" },
  { code: "AED", symbol: "د.إ", name: "درهم إماراتي", rate: 3.67, flag: "🇦🇪" },
  { code: "KWD", symbol: "د.ك", name: "دينار كويتي", rate: 0.31, flag: "🇰🇼" },
  { code: "BHD", symbol: "د.ب", name: "دينار بحريني", rate: 0.38, flag: "🇧🇭" },
  { code: "OMR", symbol: "ر.ع", name: "ريال عماني", rate: 0.38, flag: "🇴🇲" },
  { code: "QAR", symbol: "ر.ق", name: "ريال قطري", rate: 3.64, flag: "🇶🇦" },
  // الدول العربية
  { code: "EGP", symbol: "ج.م", name: "جنيه مصري", rate: 50.85, flag: "🇪🇬" },
  { code: "JOD", symbol: "د.أ", name: "دينار أردني", rate: 0.71, flag: "🇯🇴" },
  { code: "LBP", symbol: "ل.ل", name: "ليرة لبنانية", rate: 89500, flag: "🇱🇧" },
  { code: "MAD", symbol: "د.م", name: "درهم مغربي", rate: 10.05, flag: "🇲🇦" },
  { code: "TND", symbol: "د.ت", name: "دينار تونسي", rate: 3.15, flag: "🇹🇳" },
  { code: "DZD", symbol: "د.ج", name: "دينار جزائري", rate: 134.5, flag: "🇩🇿" },
  { code: "IQD", symbol: "د.ع", name: "دينار عراقي", rate: 1310, flag: "🇮🇶" },
  { code: "SYP", symbol: "ل.س", name: "ليرة سورية", rate: 13000, flag: "🇸🇾" },
  { code: "SDG", symbol: "ج.س", name: "جنيه سوداني", rate: 601, flag: "🇸🇩" },
  { code: "LYD", symbol: "د.ل", name: "دينار ليبي", rate: 4.85, flag: "🇱🇾" },
  { code: "YER", symbol: "ر.ي", name: "ريال يمني", rate: 250, flag: "🇾🇪" },
];

// خريطة الدول إلى العملات
const countryToCurrency: Record<string, string> = {
  US: "USD", GB: "GBP", 
  // الاتحاد الأوروبي
  DE: "EUR", FR: "EUR", IT: "EUR", ES: "EUR", NL: "EUR", BE: "EUR", AT: "EUR", PT: "EUR", IE: "EUR", FI: "EUR", GR: "EUR",
  // دول الخليج
  SA: "SAR", AE: "AED", KW: "KWD", BH: "BHD", OM: "OMR", QA: "QAR",
  // الدول العربية
  EG: "EGP", JO: "JOD", LB: "LBP", MA: "MAD", TN: "TND", DZ: "DZD", IQ: "IQD", SY: "SYP", SD: "SDG", LY: "LYD", YE: "YER",
};

const STORAGE_KEY = "preferred_currency";
const MANUAL_SELECTION_KEY = "currency_manually_selected";
const GEO_DETECTED_KEY = "geo_currency_detected";
const GEO_CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 ساعة

// كشف الموقع الجغرافي وتحديد العملة
const detectCurrencyByLocation = async (): Promise<Currency | null> => {
  try {
    console.log('[Currency] Detecting location...');
    const response = await fetch('https://ipapi.co/json/', { 
      signal: AbortSignal.timeout(5000) 
    });
    
    if (!response.ok) {
      console.log('[Currency] API response not ok:', response.status);
      return null;
    }
    
    const data = await response.json();
    console.log('[Currency] Location data:', data.country_code, data.country_name);
    const countryCode = data.country_code;
    
    if (countryCode && countryToCurrency[countryCode]) {
      const currencyCode = countryToCurrency[countryCode];
      const currency = currencies.find(c => c.code === currencyCode);
      console.log('[Currency] Detected currency:', currencyCode);
      return currency || null;
    }
    
    console.log('[Currency] No currency mapping for:', countryCode);
    return null;
  } catch (error) {
    console.log('[Currency] Could not detect location:', error);
    return null;
  }
};

// التحقق مما إذا كان يجب إعادة الكشف
const shouldRedetect = (): boolean => {
  // لا تعيد الكشف إذا اختار المستخدم العملة يدوياً
  const isManuallySelected = (typeof window !== 'undefined' ? window.localStorage : null)?.getItem(MANUAL_SELECTION_KEY) === 'true';
  if (isManuallySelected) return false;
  
  const lastDetection = (typeof window !== 'undefined' ? window.localStorage : null)?.getItem(GEO_DETECTED_KEY);
  if (!lastDetection) return true;
  
  const timestamp = parseInt(lastDetection, 10);
  if (isNaN(timestamp)) return true;
  
  // إعادة الكشف إذا مر أكثر من 24 ساعة
  return Date.now() - timestamp > GEO_CACHE_DURATION;
};

export const useCurrency = () => {
  const [selectedCurrency, setSelectedCurrencyState] = useState<Currency>(() => {
    const saved = (typeof window !== 'undefined' ? window.localStorage : null)?.getItem(STORAGE_KEY);
    if (saved) {
      const found = currencies.find(c => c.code === saved);
      if (found) return found;
    }
    return currencies[0];
  });

  // كشف العملة حسب الموقع الجغرافي
  useEffect(() => {
    // فقط إذا يجب إعادة الكشف
    if (shouldRedetect()) {
      console.log('[Currency] Starting geo-detection...');
      detectCurrencyByLocation().then(detectedCurrency => {
        if (detectedCurrency) {
          console.log('[Currency] Setting detected currency:', detectedCurrency.code);
          setSelectedCurrencyState(detectedCurrency);
          (typeof window !== 'undefined' ? window.localStorage : null)?.setItem(STORAGE_KEY, detectedCurrency.code);
        }
        // حفظ وقت الكشف
        (typeof window !== 'undefined' ? window.localStorage : null)?.setItem(GEO_DETECTED_KEY, Date.now().toString());
      });
    } else {
      console.log('[Currency] Skipping detection - manual or cached');
    }
  }, []);

  // Listen for changes from other components
  useEffect(() => {
    const handleStorageChange = () => {
      const saved = (typeof window !== 'undefined' ? window.localStorage : null)?.getItem(STORAGE_KEY);
      if (saved) {
        const found = currencies.find(c => c.code === saved);
        if (found && found.code !== selectedCurrency.code) {
          setSelectedCurrencyState(found);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    
    // Also check periodically for changes from same tab
    const interval = setInterval(() => {
      const saved = (typeof window !== 'undefined' ? window.localStorage : null)?.getItem(STORAGE_KEY);
      if (saved) {
        const found = currencies.find(c => c.code === saved);
        if (found && found.code !== selectedCurrency.code) {
          setSelectedCurrencyState(found);
        }
      }
    }, 500);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, [selectedCurrency.code]);

  const setSelectedCurrency = useCallback((currency: Currency) => {
    setSelectedCurrencyState(currency);
    (typeof window !== 'undefined' ? window.localStorage : null)?.setItem(STORAGE_KEY, currency.code);
    // علامة على أن المستخدم اختار العملة يدوياً
    (typeof window !== 'undefined' ? window.localStorage : null)?.setItem(MANUAL_SELECTION_KEY, 'true');
  }, []);

  const convert = useCallback((amountInUSD: number): number => {
    return amountInUSD * selectedCurrency.rate;
  }, [selectedCurrency.rate]);

  const format = useCallback((amountInUSD: number): string => {
    const converted = convert(amountInUSD);
    return `${selectedCurrency.symbol}${converted.toFixed(2)}`;
  }, [convert, selectedCurrency.symbol]);

  return {
    selectedCurrency,
    setSelectedCurrency,
    currencies,
    convert,
    format,
  };
};
