import * as React from "react";
import { FlatList,
  SectionList,
  View,
  Text,
  Pressable,
  ViewStyle,
  TextStyle,
  ListRenderItem,
  SectionListData,
  SectionListRenderItem, StyleSheet} from "react-native";
import { useTheme } from "@/lib/theme";
import { borderRadius, spacing, fontSize, fontWeight } from "@/constants/design-system";

interface ListProps<T> {
  data: T[];
  renderItem: ListRenderItem<T>;
  keyExtractor?: (item: T, index: number) => string;
  horizontal?: boolean;
  numColumns?: number;
  showsVerticalScrollIndicator?: boolean;
  showsHorizontalScrollIndicator?: boolean;
  ItemSeparatorComponent?: React.ComponentType<any> | null;
  ListHeaderComponent?: React.ComponentType<any> | React.ReactElement | null;
  ListFooterComponent?: React.ComponentType<any> | React.ReactElement | null;
  ListEmptyComponent?: React.ComponentType<any> | React.ReactElement | null;
  refreshing?: boolean;
  onRefresh?: () => void;
  onEndReached?: () => void;
  onEndReachedThreshold?: number;
  style?: ViewStyle;
  contentContainerStyle?: ViewStyle;
}

interface SectionedListProps<T, S> {
  sections: SectionListData<T, S>[];
  renderItem: SectionListRenderItem<T, S>;
  renderSectionHeader?: (info: { section: SectionListData<T, S> }) => React.ReactElement | null;
  renderSectionFooter?: (info: { section: SectionListData<T, S> }) => React.ReactElement | null;
  keyExtractor?: (item: T, index: number) => string;
  showsVerticalScrollIndicator?: boolean;
  ItemSeparatorComponent?: React.ComponentType<any> | null;
  SectionSeparatorComponent?: React.ComponentType<any> | null;
  ListHeaderComponent?: React.ComponentType<any> | React.ReactElement | null;
  ListFooterComponent?: React.ComponentType<any> | React.ReactElement | null;
  ListEmptyComponent?: React.ComponentType<any> | React.ReactElement | null;
  refreshing?: boolean;
  onRefresh?: () => void;
  onEndReached?: () => void;
  onEndReachedThreshold?: number;
  style?: ViewStyle;
  contentContainerStyle?: ViewStyle;
}

interface ListItemProps {
  children: React.ReactNode;
  onPress?: () => void;
  disabled?: boolean;
  style?: ViewStyle;
  pressableStyle?: ViewStyle;
}

interface ListItemContentProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

interface ListItemTitleProps {
  children: React.ReactNode;
  style?: TextStyle;
}

interface ListItemDescriptionProps {
  children: React.ReactNode;
  style?: TextStyle;
}

interface ListItemIconProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

interface ListSeparatorProps {
  style?: ViewStyle;
}

interface ListEmptyStateProps {
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  style?: ViewStyle;
}

// Generic List component
function List<T>({
  data,
  renderItem,
  keyExtractor,
  horizontal = false,
  numColumns = 1,
  showsVerticalScrollIndicator = true,
  showsHorizontalScrollIndicator = true,
  ItemSeparatorComponent,
  ListHeaderComponent,
  ListFooterComponent,
  ListEmptyComponent,
  refreshing,
  onRefresh,
  onEndReached,
  onEndReachedThreshold = 0.1,
  style,
  contentContainerStyle,
  ...props
}: ListProps<T>) {
  const { colors } = useTheme();

  const listStyle: ViewStyle = {
    backgroundColor: colors.background,
    ...style,
  };

  const defaultContentContainerStyle: ViewStyle = {
    flexGrow: 1,
    ...contentContainerStyle,
  };

  return (
    <FlatList
      data={data}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      horizontal={horizontal}
      numColumns={numColumns}
      showsVerticalScrollIndicator={showsVerticalScrollIndicator}
      showsHorizontalScrollIndicator={showsHorizontalScrollIndicator}
      ItemSeparatorComponent={ItemSeparatorComponent}
      ListHeaderComponent={ListHeaderComponent}
      ListFooterComponent={ListFooterComponent}
      ListEmptyComponent={ListEmptyComponent}
      refreshing={refreshing}
      onRefresh={onRefresh}
      onEndReached={onEndReached}
      onEndReachedThreshold={onEndReachedThreshold}
      style={listStyle}
      contentContainerStyle={defaultContentContainerStyle}
      {...props}
    />
  );
}

// Sectioned List component
function SectionedList<T, S>({
  sections,
  renderItem,
  renderSectionHeader,
  renderSectionFooter,
  keyExtractor,
  showsVerticalScrollIndicator = true,
  ItemSeparatorComponent,
  SectionSeparatorComponent,
  ListHeaderComponent,
  ListFooterComponent,
  ListEmptyComponent,
  refreshing,
  onRefresh,
  onEndReached,
  onEndReachedThreshold = 0.1,
  style,
  contentContainerStyle,
  ...props
}: SectionedListProps<T, S>) {
  const { colors } = useTheme();

  const listStyle: ViewStyle = {
    backgroundColor: colors.background,
    ...style,
  };

  const defaultContentContainerStyle: ViewStyle = {
    flexGrow: 1,
    ...contentContainerStyle,
  };

  return (
    <SectionList
      sections={sections}
      renderItem={renderItem}
      renderSectionHeader={renderSectionHeader}
      renderSectionFooter={renderSectionFooter}
      keyExtractor={keyExtractor}
      showsVerticalScrollIndicator={showsVerticalScrollIndicator}
      ItemSeparatorComponent={ItemSeparatorComponent}
      SectionSeparatorComponent={SectionSeparatorComponent}
      ListHeaderComponent={ListHeaderComponent}
      ListFooterComponent={ListFooterComponent}
      ListEmptyComponent={ListEmptyComponent}
      refreshing={refreshing}
      onRefresh={onRefresh}
      onEndReached={onEndReached}
      onEndReachedThreshold={onEndReachedThreshold}
      style={listStyle}
      contentContainerStyle={defaultContentContainerStyle}
      {...props}
    />
  );
}

// List Item component
const ListItem: React.FC<ListItemProps> = ({
  children,
  onPress,
  disabled = false,
  style,
  pressableStyle
}) => {
  const { colors } = useTheme();

  const itemStyle: ViewStyle = {
    backgroundColor: colors.card,
    ...style,
  };

  const defaultPressableStyle: ViewStyle = {
    opacity: disabled ? 0.5 : 1,
    ...pressableStyle,
  };

  if (onPress && !disabled) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          defaultPressableStyle,
          pressed && { opacity: 0.7 }
        ]}
      >
        <View style={itemStyle}>
          {children}
        </View>
      </Pressable>
    );
  }

  return (
    <View style={StyleSheet.flatten([itemStyle, defaultPressableStyle])}>
      {children}
    </View>
  );
};

// List Item Content component
const ListItemContent: React.FC<ListItemContentProps> = ({ children, style }) => {
  const contentStyle: ViewStyle = {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.md,
    gap: spacing.sm,
    ...style,
  };

  return <View style={contentStyle}>{children}</View>;
};

// List Item Title component
const ListItemTitle: React.FC<ListItemTitleProps> = ({ children, style }) => {
  const { colors } = useTheme();

  const titleStyle: TextStyle = {
    fontSize: fontSize.base,
    fontWeight: fontWeight.medium as any,
    color: colors.foreground,
    flex: 1,
    ...style,
  };

  return <Text style={titleStyle} numberOfLines={1}>{children}</Text>;
};

// List Item Description component
const ListItemDescription: React.FC<ListItemDescriptionProps> = ({ children, style }) => {
  const { colors } = useTheme();

  const descriptionStyle: TextStyle = {
    fontSize: fontSize.sm,
    color: colors.muted,
    flex: 1,
    marginTop: 2,
    ...style,
  };

  return <Text style={descriptionStyle} numberOfLines={2}>{children}</Text>;
};

// List Item Icon component
const ListItemIcon: React.FC<ListItemIconProps> = ({ children, style }) => {
  const iconStyle: ViewStyle = {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    justifyContent: "center",
    alignItems: "center",
    ...style,
  };

  return <View style={iconStyle}>{children}</View>;
};

// List Separator component
const ListSeparator: React.FC<ListSeparatorProps> = ({ style }) => {
  const { colors } = useTheme();

  const separatorStyle: ViewStyle = {
    height: 1,
    backgroundColor: colors.border,
    marginLeft: spacing.md,
    ...style,
  };

  return <View style={separatorStyle} />;
};

// List Empty State component
const ListEmptyState: React.FC<ListEmptyStateProps> = ({
  title = "Nenhum item encontrado",
  description = "Não há itens para exibir no momento.",
  icon,
  action,
  style
}) => {
  const { colors } = useTheme();

  const containerStyle: ViewStyle = {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.xl,
    ...style,
  };

  const titleStyle: TextStyle = {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold as any,
    color: colors.foreground,
    textAlign: "center",
    marginBottom: spacing.sm,
  };

  const descriptionStyle: TextStyle = {
    fontSize: fontSize.sm,
    color: colors.muted,
    textAlign: "center",
    marginBottom: spacing.lg,
  };

  return (
    <View style={containerStyle}>
      {icon && <View style={{ marginBottom: spacing.md }}>{icon}</View>}
      <Text style={titleStyle}>{title}</Text>
      <Text style={descriptionStyle}>{description}</Text>
      {action}
    </View>
  );
};

export {
  List,
  SectionedList,
  ListItem,
  ListItemContent,
  ListItemTitle,
  ListItemDescription,
  ListItemIcon,
  ListSeparator,
  ListEmptyState
};
