import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from 'react';
import { StyleSheet } from 'react-native';
import uiConfigService, { Theme, UIConfig } from '@/services/uiConfigService';

interface ThemeContextType {
  theme: Theme | null;
  config: UIConfig | null;
  isLoading: boolean;
  error: string | null;
  refreshTheme: () => Promise<void>;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface DynamicThemeProviderProps {
  children: ReactNode;
  appId?: string;
  environment?: string;
}

export const DynamicThemeProvider: React.FC<DynamicThemeProviderProps> = ({
  children,
  appId = 'bachelor-mess-manager',
  environment = 'development',
}) => {
  const [theme, setTheme] = useState<Theme | null>(null);
  const [config, setConfig] = useState<UIConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadTheme = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const uiConfig = await uiConfigService.getActiveConfig(
        appId,
        environment
      );
      setConfig(uiConfig);
      setTheme(uiConfig.theme);

      // Apply dynamic styles
      applyDynamicStyles(uiConfig.theme);
    } catch (err) {
      console.error('Error loading theme:', err);
      setError(err instanceof Error ? err.message : 'Failed to load theme');
    } finally {
      setIsLoading(false);
    }
  };

  const refreshTheme = async () => {
    await loadTheme();
  };

  useEffect(() => {
    loadTheme();

    // Listen for configuration changes
    const unsubscribe = uiConfigService.addListener(newConfig => {
      setConfig(newConfig);
      setTheme(newConfig.theme);
      applyDynamicStyles(newConfig.theme);
    });

    return unsubscribe;
  }, [appId, environment]);

  const applyDynamicStyles = (theme: Theme) => {
    // Create dynamic styles based on theme
    const dynamicStyles = StyleSheet.create({
      container: {
        backgroundColor: theme.backgroundColor,
      },
      text: {
        color: theme.textColor,
      },
      primaryButton: {
        backgroundColor: theme.primaryColor,
        borderRadius: theme.borderRadius,
      },
      secondaryButton: {
        backgroundColor: theme.secondaryColor,
        borderRadius: theme.borderRadius,
      },
      accentButton: {
        backgroundColor: theme.accentColor,
        borderRadius: theme.borderRadius,
      },
      card: {
        backgroundColor: theme.backgroundColor,
        borderRadius: theme.borderRadius,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
      },
      input: {
        backgroundColor: theme.secondaryColor,
        borderRadius: theme.borderRadius,
        borderColor: theme.primaryColor,
        color: theme.textColor,
      },
      tabBar: {
        backgroundColor: theme.backgroundColor,
        borderTopColor: theme.secondaryColor,
      },
    });

    // Store dynamic styles globally (you might want to use a more sophisticated approach)
    (global as any).dynamicStyles = dynamicStyles;
  };

  const contextValue: ThemeContextType = {
    theme,
    config,
    isLoading,
    error,
    refreshTheme,
  };

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useDynamicTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error(
      'useDynamicTheme must be used within a DynamicThemeProvider'
    );
  }
  return context;
};

export const useTheme = () => {
  const { theme } = useDynamicTheme();
  return theme;
};

export const useUIConfig = () => {
  const { config } = useDynamicTheme();
  return config;
};

export const useThemeLoading = () => {
  const { isLoading, error } = useDynamicTheme();
  return { isLoading, error };
};

// Dynamic styled components
export const DynamicView: React.FC<any> = ({ style, ...props }) => {
  const { theme } = useDynamicTheme();

  const dynamicStyle = {
    backgroundColor: theme?.backgroundColor,
    ...style,
  };

  return <div style={dynamicStyle} {...props} />;
};

export const DynamicText: React.FC<any> = ({ style, ...props }) => {
  const { theme } = useDynamicTheme();

  const dynamicStyle = {
    color: theme?.textColor,
    ...style,
  };

  return <span style={dynamicStyle} {...props} />;
};

export const DynamicButton: React.FC<any> = ({
  style,
  variant = 'primary',
  ...props
}) => {
  const { theme } = useDynamicTheme();

  const getButtonStyle = () => {
    switch (variant) {
      case 'primary':
        return { backgroundColor: theme?.primaryColor };
      case 'secondary':
        return { backgroundColor: theme?.secondaryColor };
      case 'accent':
        return { backgroundColor: theme?.accentColor };
      default:
        return { backgroundColor: theme?.primaryColor };
    }
  };

  const dynamicStyle = {
    borderRadius: theme?.borderRadius,
    ...getButtonStyle(),
    ...style,
  };

  return <button style={dynamicStyle} {...props} />;
};

export const DynamicCard: React.FC<any> = ({ style, ...props }) => {
  const { theme } = useDynamicTheme();

  const dynamicStyle = {
    backgroundColor: theme?.backgroundColor,
    borderRadius: theme?.borderRadius,
    boxShadow: theme?.shadow,
    ...style,
  };

  return <div style={dynamicStyle} {...props} />;
};

export default DynamicThemeProvider;
