import { useCallback, useEffect, useRef } from 'react';
import { Dimensions, Keyboard, type NativeSyntheticEvent, type NativeScrollEvent, type TextInput } from 'react-native';
import type { ScrollView } from 'react-native';

const KEYBOARD_PADDING = 20;
const KEYBOARD_SCROLL_DELAY_MS = 100;

export function useScrollToFocusedInput(
  scrollViewRef: React.RefObject<ScrollView | null>
) {
  const scrollYRef = useRef(0);
  const keyboardHeightRef = useRef(0);
  const focusedInputRef = useRef<TextInput | null>(null);

  const scrollToFocusedInput = useCallback(() => {
    const scrollView = scrollViewRef.current;
    const inputRef = focusedInputRef.current;
    if (!scrollView || !inputRef) return;
    const input = inputRef as unknown as {
      measureInWindow: (cb: (x: number, y: number, w: number, h: number) => void) => void;
    };
    if (typeof input.measureInWindow !== 'function') return;
    const windowHeight = Dimensions.get('window').height;
    const keyboardHeight = keyboardHeightRef.current || 280;
    const visibleBottom = windowHeight - keyboardHeight - KEYBOARD_PADDING;

    input.measureInWindow((_ix, iy, _iw, ih) => {
      const inputBottom = iy + ih;
      if (inputBottom <= visibleBottom) return;
      const scrollBy = inputBottom - visibleBottom;
      const newY = Math.max(0, scrollYRef.current + scrollBy);
      scrollView.scrollTo({ y: newY, animated: true });
    });
  }, [scrollViewRef]);

  useEffect(() => {
    const sub = Keyboard.addListener('keyboardDidShow', (e) => {
      keyboardHeightRef.current = e.endCoordinates?.height ?? 280;
      setTimeout(scrollToFocusedInput, KEYBOARD_SCROLL_DELAY_MS);
    });
    return () => sub.remove();
  }, [scrollToFocusedInput]);

  const focusScroll = useCallback((inputRef: TextInput | null) => {
    focusedInputRef.current = inputRef;
    setTimeout(scrollToFocusedInput, KEYBOARD_SCROLL_DELAY_MS);
  }, [scrollToFocusedInput]);

  const onScroll = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    scrollYRef.current = e.nativeEvent.contentOffset.y;
  }, []);

  return { onScroll, focusScroll };
}
