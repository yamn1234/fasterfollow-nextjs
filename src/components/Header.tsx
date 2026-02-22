import { useState } from "react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Menu, X, ShoppingCart, User, LayoutDashboard, LogIn } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useHeaderFooterSettings } from "@/hooks/useHeaderFooterSettings";
import { useTranslation } from "@/hooks/useTranslation";
import LanguageToggle from "@/components/LanguageToggle";

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, profile } = useAuth();
  const { headerSettings } = useHeaderFooterSettings();
  const { t, isArabic } = useTranslation();

  const navItems = headerSettings.nav_items;

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-card/80 backdrop-blur-lg">
      <div className="container flex h-16 items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 min-w-0">
          {headerSettings.logo_url ? (
            <img
              src={headerSettings.logo_url}
              alt={headerSettings.logo_text}
              width="40"
              height="40"
              className="h-10 w-10 rounded-xl object-cover"
              fetchPriority="high"
            />
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-primary">
              <ShoppingCart className="h-5 w-5 text-primary-foreground" />
            </div>
          )}
          <span className="text-lg sm:text-xl font-bold text-gradient bg-primary-foreground truncate max-w-[10rem] sm:max-w-none">
            {headerSettings.logo_text}
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex items-center gap-1">
          {navItems.map((item) =>
            item.isLink ? (
              <Link
                key={item.label}
                href={item.href}
                className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-secondary"
              >
                {item.label}
              </Link>
            ) : (
              <a
                key={item.label}
                href={item.href}
                className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-secondary"
              >
                {item.label}
              </a>
            )
          )}
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          <LanguageToggle variant="text" />
          
          {user && headerSettings.show_balance && (
            <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-secondary rounded-lg">
              <span className="text-sm text-muted-foreground">{t('yourBalance')}</span>
              <span className="font-bold text-primary">
                ${profile?.balance?.toFixed(2) || "0.00"}
              </span>
            </div>
          )}

          {user ? (
            <>
              <Link href="/dashboard">
                <Button variant="outline" size="default" className="hidden sm:flex">
                  <LayoutDashboard className="h-4 w-4" />
                  {t('controlPanel')}
                </Button>
              </Link>

              <Link href="/dashboard">
                <Button variant="hero" size="default">
                  <User className="h-4 w-4" />
                  <span className="hidden sm:inline">{t('myAccount')}</span>
                </Button>
              </Link>
            </>
          ) : (
            <Link href="/auth">
              <Button variant="hero" size="default" aria-label={t('loginBtn')}>
                <LogIn className="h-4 w-4" />
                <span className="hidden sm:inline">{t('loginBtn')}</span>
              </Button>
            </Link>
          )}

          {/* Mobile Menu Toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isMenuOpen && (
        <div className="lg:hidden border-t border-border bg-card animate-fade-in">
          <nav className="container py-4 flex flex-col gap-1">
            {user ? (
              <Link
                href="/dashboard"
                className="px-4 py-3 text-sm font-medium text-primary hover:text-foreground transition-colors rounded-lg hover:bg-secondary flex items-center gap-2"
                onClick={() => setIsMenuOpen(false)}
              >
                <LayoutDashboard className="h-4 w-4" />
                {t('controlPanel')}
              </Link>
            ) : (
              <Link
                href="/auth"
                className="px-4 py-3 text-sm font-medium text-primary hover:text-foreground transition-colors rounded-lg hover:bg-secondary flex items-center gap-2"
                onClick={() => setIsMenuOpen(false)}
              >
                <LogIn className="h-4 w-4" />
                {t('loginBtn')}
              </Link>
            )}
            {navItems.map((item) =>
              item.isLink ? (
                <Link
                  key={item.label}
                  href={item.href}
                  className="px-4 py-3 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-secondary"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.label}
                </Link>
              ) : (
                <a
                  key={item.label}
                  href={item.href}
                  className="px-4 py-3 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-secondary"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.label}
                </a>
              )
            )}
          </nav>
        </div>
      )}
    </header>
  );
};

export default Header;
