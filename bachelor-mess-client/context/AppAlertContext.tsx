import React, {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
} from 'react';
import { Alert, type AlertVariant } from '@/components/Alert';

export interface AppAlertOptions {
  variant?: AlertVariant;
  buttonText?: string;
  onConfirm?: () => void;
  secondaryButtonText?: string;
  onCancel?: () => void;
}

interface AppAlertState {
  visible: boolean;
  title: string;
  message: string;
  variant: AlertVariant;
  buttonText: string;
  onConfirm?: () => void;
  secondaryButtonText?: string;
  onCancel?: () => void;
}

type ShowAlertFn = (
  title: string,
  message: string,
  options?: AppAlertOptions
) => void;

const defaultState: AppAlertState = {
  visible: false,
  title: '',
  message: '',
  variant: 'info',
  buttonText: 'OK',
};

const Context = createContext<{ showAlert: ShowAlertFn } | null>(null);

/** Ref for imperative use outside React tree (e.g. services). Set by provider. */
let globalShowAlertRef: ShowAlertFn | null = null;

/**
 * Show the app's custom alert (theme-based) from anywhere.
 * Use this instead of Alert.alert() so all popups use the same styled modal and theme colors.
 *
 * ONLY ALLOWED USE OF SYSTEM ALERT: The block below is the only place in the app that may
 * call react-native's Alert.alert — as a fallback when the provider is not yet mounted.
 * Do not import Alert from 'react-native' elsewhere; ESLint forbids it.
 */
export function showAppAlert(
  title: string,
  message: string,
  options?: AppAlertOptions
): void {
  if (globalShowAlertRef) {
    globalShowAlertRef(title, message, options);
  } else {
    if (__DEV__) {
      console.warn('showAppAlert called before AlertProvider mounted; using fallback');
    }
    // Intentional: only allowed use of system Alert in the app (fallback when provider not mounted).
    // eslint-disable-next-line @typescript-eslint/no-require-imports -- deliberate dynamic require for fallback
    const { Alert } = require('react-native');
    Alert.alert(title, message);
  }
}

export function AppAlertProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppAlertState>(defaultState);

  const showAlert = useCallback<ShowAlertFn>(
    (title, message, options = {}) => {
      setState({
        visible: true,
        title,
        message,
        variant: options.variant ?? 'info',
        buttonText: options.buttonText ?? 'OK',
        onConfirm: options.onConfirm,
        secondaryButtonText: options.secondaryButtonText,
        onCancel: options.onCancel,
      });
    },
    []
  );

  React.useEffect(() => {
    globalShowAlertRef = showAlert;
    return () => {
      globalShowAlertRef = null;
    };
  }, [showAlert]);

  const close = useCallback(() => {
    setState((prev) => ({ ...prev, visible: false }));
  }, []);

  const stateRef = useRef(state);
  stateRef.current = state;

  const handleConfirm = useCallback(() => {
    stateRef.current.onConfirm?.();
    close();
  }, [close]);

  const handleClose = useCallback(() => {
    stateRef.current.onCancel?.();
    close();
  }, [close]);

  return (
    <Context.Provider value={{ showAlert }}>
      {children}
      <Alert
        visible={state.visible}
        title={state.title}
        message={state.message}
        onClose={handleClose}
        variant={state.variant}
        buttonText={state.buttonText}
        onConfirm={state.onConfirm ? handleConfirm : undefined}
        secondaryButtonText={state.secondaryButtonText}
      />
    </Context.Provider>
  );
}

export function useAppAlert(): { showAlert: ShowAlertFn } {
  const ctx = useContext(Context);
  if (!ctx) {
    return {
      showAlert: showAppAlert,
    };
  }
  return ctx;
}
