import React from 'react';
import { IconListRow } from './IconListRow';
import { StatusBadge } from './StatusBadge';

/**
 * Generic list row with a status badge. Use for: requests, history, bazar entries, meal status, etc.
 */
export interface StatusRowProps {
  icon: React.ReactNode;
  iconBackgroundColor?: string;
  title: string;
  subtitle?: string;
  statusLabel: string;
  statusColor: string;
  borderBottomColor?: string;
  backgroundColor?: string;
  onPress?: () => void;
}

export const StatusRow: React.FC<StatusRowProps> = ({
  icon,
  iconBackgroundColor,
  title,
  subtitle,
  statusLabel,
  statusColor,
  borderBottomColor,
  backgroundColor,
  onPress,
}) => {
  return (
    <IconListRow
      icon={icon}
      iconBackgroundColor={iconBackgroundColor}
      title={title}
      subtitle={subtitle}
      right={<StatusBadge label={statusLabel} color={statusColor} />}
      borderBottomColor={borderBottomColor}
      backgroundColor={backgroundColor}
      onPress={onPress}
    />
  );
};
