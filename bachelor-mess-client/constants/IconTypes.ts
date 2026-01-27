import type { ComponentProps } from 'react';
import { Ionicons } from '@expo/vector-icons';

/** Use for Ionicons `name` prop to avoid `any` */
export type IconName = ComponentProps<typeof Ionicons>['name'];
