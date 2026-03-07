/**
 * TouchableOpacity that applies the app's centralized press throttle to onPress.
 * Use for buttons/links where double-tap should be ignored (e.g. notification bell, navigation).
 */
import React from 'react';
import {
  TouchableOpacity,
  type TouchableOpacityProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { useThrottledCallback, PRESS_THROTTLE_MS } from '@/hooks/useDebounce';

export type ThrottledTouchableOpacityProps = Omit<
  TouchableOpacityProps,
  'onPress'
> & {
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
};

export function ThrottledTouchableOpacity({
  onPress,
  ...rest
}: ThrottledTouchableOpacityProps) {
  const throttledOnPress = useThrottledCallback(onPress, PRESS_THROTTLE_MS);
  return <TouchableOpacity onPress={throttledOnPress} {...rest} />;
}
