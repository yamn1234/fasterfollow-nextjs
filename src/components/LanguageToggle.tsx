import { Button } from "@/components/ui/button";
import { Globe } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";

interface LanguageToggleProps {
  variant?: "icon" | "text" | "full";
  className?: string;
}

const LanguageToggle = ({ variant = "icon", className = "" }: LanguageToggleProps) => {
  const { language, toggleLanguage, t } = useTranslation();

  if (variant === "icon") {
    return (
      <Button
        variant="ghost"
        size="icon"
        onClick={toggleLanguage}
        className={className}
        title={language === 'ar' ? 'Switch to English' : 'التبديل إلى العربية'}
      >
        <Globe className="h-5 w-5" />
      </Button>
    );
  }

  if (variant === "text") {
    return (
      <Button
        variant="ghost"
        size="sm"
        onClick={toggleLanguage}
        className={className}
      >
        {language === 'ar' ? 'EN' : 'عربي'}
      </Button>
    );
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={toggleLanguage}
      className={`gap-2 ${className}`}
    >
      <Globe className="h-4 w-4" />
      {language === 'ar' ? 'English' : 'العربية'}
    </Button>
  );
};

export default LanguageToggle;
