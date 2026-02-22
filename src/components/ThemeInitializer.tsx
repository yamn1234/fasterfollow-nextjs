import { useThemeSettings } from '@/hooks/useThemeSettings';

const ThemeInitializer = ({ children }: { children: React.ReactNode }) => {
  useThemeSettings();
  return <>{children}</>;
};

export default ThemeInitializer;
