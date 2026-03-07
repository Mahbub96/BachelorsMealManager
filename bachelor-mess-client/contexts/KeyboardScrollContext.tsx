import React, { createContext, useContext, useRef, useCallback } from 'react';
import {
  ScrollView,
  type TextInput,
  type NativeSyntheticEvent,
  type NativeScrollEvent,
} from 'react-native';
import { useScrollToFocusedInput } from '@/hooks/useScrollToFocusedInput';

type FocusScrollFn = (inputRef: TextInput | null) => void;

const KeyboardScrollContext = createContext<{ focusScroll: FocusScrollFn } | null>(null);

export function useKeyboardScroll(): { focusScroll: FocusScrollFn } | null {
  return useContext(KeyboardScrollContext);
}

interface KeyboardAwareScrollViewProps extends React.ComponentProps<typeof ScrollView> {
  children: React.ReactNode;
  /** Called when mounted so parent can use focusScroll for raw TextInputs */
  onReady?: (api: { focusScroll: FocusScrollFn }) => void;
}

export function KeyboardAwareScrollView({
  children,
  onScroll,
  onReady,
  ...scrollViewProps
}: KeyboardAwareScrollViewProps) {
  const scrollViewRef = useRef<ScrollView>(null);
  const { onScroll: trackScroll, focusScroll } = useScrollToFocusedInput(scrollViewRef);

  React.useEffect(() => {
    onReady?.({ focusScroll });
  }, [onReady, focusScroll]);

  const handleScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      trackScroll(e);
      onScroll?.(e);
    },
    [trackScroll, onScroll]
  );

  return (
    <KeyboardScrollContext.Provider value={{ focusScroll }}>
      <ScrollView
        ref={scrollViewRef}
        onScroll={handleScroll}
        scrollEventThrottle={32}
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
        {...scrollViewProps}
      >
        {children}
      </ScrollView>
    </KeyboardScrollContext.Provider>
  );
}
