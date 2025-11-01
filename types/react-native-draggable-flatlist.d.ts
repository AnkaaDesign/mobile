/**
 * Type declarations for react-native-draggable-flatlist
 * @see https://github.com/computerjazz/react-native-draggable-flatlist
 */

declare module 'react-native-draggable-flatlist' {
  import { ComponentType, ReactElement } from 'react';
  import { FlatListProps, StyleProp, ViewStyle } from 'react-native';

  export interface RenderItemParams<T> {
    item: T;
    index?: number;
    drag: () => void;
    isActive: boolean;
    getIndex: () => number | undefined;
  }

  export interface DraggableFlatListProps<T> extends Omit<FlatListProps<T>, 'renderItem' | 'data'> {
    data: T[];
    renderItem: (params: RenderItemParams<T>) => ReactElement | null;
    keyExtractor: (item: T, index: number) => string;
    onDragBegin?: (index: number) => void;
    onRelease?: (index: number) => void;
    onDragEnd?: (params: { data: T[]; from: number; to: number }) => void;
    autoscrollThreshold?: number;
    autoscrollSpeed?: number;
    animationConfig?: object;
    activationDistance?: number;
    layoutInvalidationKey?: string;
    onScrollOffsetChange?: (offset: number) => void;
    onPlaceholderIndexChange?: (index: number) => void;
    dragItemOverflow?: boolean;
    containerStyle?: StyleProp<ViewStyle>;
  }

  export default function DraggableFlatList<T>(
    props: DraggableFlatListProps<T>
  ): ReactElement;

  export interface ScaleDecoratorProps {
    children: ReactElement;
    activeScale?: number;
  }

  export const ScaleDecorator: ComponentType<ScaleDecoratorProps>;

  export interface OpacityDecoratorProps {
    children: ReactElement;
    activeOpacity?: number;
  }

  export const OpacityDecorator: ComponentType<OpacityDecoratorProps>;

  export interface ShadowDecoratorProps {
    children: ReactElement;
  }

  export const ShadowDecorator: ComponentType<ShadowDecoratorProps>;
}
