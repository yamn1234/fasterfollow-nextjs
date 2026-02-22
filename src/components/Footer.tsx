import { ShoppingCart, Mail, MessageCircle, Phone, Send } from "lucide-react";
import { useHeaderFooterSettings } from "@/hooks/useHeaderFooterSettings";
import { useTranslation } from "@/hooks/useTranslation";

const Footer = () => {
  const currentYear = new Date().getFullYear();
  const { footerSettings } = useHeaderFooterSettings();
  const { t, isArabic } = useTranslation();

  const getSocialIcon = (type: string) => {
    switch (type) {
      case 'whatsapp':
      case 'telegram':
        return <MessageCircle className="h-5 w-5" />;
      case 'email':
        return <Mail className="h-5 w-5" />;
      case 'phone':
        return <Phone className="h-5 w-5" />;
      case 'twitter':
        return <Send className="h-5 w-5" />;
      default:
        return <MessageCircle className="h-5 w-5" />;
    }
  };

  const enabledSocialLinks = footerSettings.social_links.filter(link => link.enabled);

  const footerDescription = isArabic 
    ? footerSettings.description
    : 'The best social media services store in the Arab world. We provide high-quality services at competitive prices.';

  return (
    <footer className="bg-foreground text-background py-12 lg:py-16">
      <div className="container">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          {/* Brand */}
          <div className="lg:col-span-1">
            <a href="/" className="flex items-center gap-2 mb-4">
              {footerSettings.logo_url ? (
                <img
                  src={footerSettings.logo_url}
                  alt={footerSettings.logo_text}
                  width="40"
                  height="40"
                  loading="lazy"
                  className="h-10 w-10 rounded-xl object-cover"
                />
              ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-primary">
                  <ShoppingCart className="h-5 w-5 text-primary-foreground" />
                </div>
              )}
              <span className="text-xl font-bold">{footerSettings.logo_text}</span>
            </a>
            <p className="text-background/70 mb-6 leading-relaxed">
              {footerDescription}
            </p>
            <div className="flex gap-3">
              {enabledSocialLinks.map((link, index) => (
                <a
                  key={index}
                  href={link.url}
                  className="w-10 h-10 rounded-lg bg-background/10 flex items-center justify-center hover:bg-primary transition-colors"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {getSocialIcon(link.type)}
                </a>
              ))}
            </div>
          </div>

          {/* Dynamic Link Groups */}
          {footerSettings.link_groups.map((group, index) => (
            <div key={index}>
              <h3 className="font-bold text-lg mb-4">{group.title}</h3>
              <ul className="space-y-3">
                {group.links.map((link, linkIndex) => (
                  <li key={linkIndex}>
                    <a
                      href={link.href}
                      className="text-background/70 hover:text-primary transition-colors"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-background/10 mt-12 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-background/60 text-sm">
            © {currentYear} {footerSettings.copyright_text}. {t('allRightsReserved')}
          </p>
          {footerSettings.show_payment_logos && (
            <div className="flex items-center gap-4">
              <img
                src="https://upload.wikimedia.org/wikipedia/commons/5/5e/Visa_Inc._logo.svg"
                alt="Visa"
                width="74"
                height="24"
                loading="lazy"
                className="h-6 w-auto opacity-60 hover:opacity-100 transition-opacity"
              />
              <img
                src="https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg"
                alt="Mastercard"
                width="38"
                height="24"
                loading="lazy"
                className="h-6 w-auto opacity-60 hover:opacity-100 transition-opacity"
              />
            </div>
          )}
        </div>
      </div>
    </footer>
  );
};

export default Footer;
