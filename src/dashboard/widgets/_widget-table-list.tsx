// FlatList-backed table primitive for dashboard widgets.
//
// Why this exists: every table widget previously rendered all its rows
// directly inside widget-card's ScrollView via `.map()`. That works for 20
// rows but blows memory on 200+ rows because every row component mounts
// even when off-screen. FlatList virtualizes — only mounts what's visible
// plus a small overscan window.
//
// Critical constraint: widget-card.tsx must be opted into `bodyAsList: true`
// when using this component. Same-orientation nested scrolls don't compose
// in React Native, so the widget-card's inner ScrollView has to be skipped.
//
// Usage pattern in a widget:
//
//   <WidgetCard bodyAsList bodyMaxHeight={...} ...>
//     <WidgetTableList
//       data={rows}
//       keyExtractor={(r) => r.id}
//       renderItem={({ item, index }) => (
//         <WidgetTableRow density={density} index={index} ...>
//           {/* cells */}
//         </WidgetTableRow>
//       )}
//       ListHeaderComponent={
//         <>
//           {showSearch && <WidgetTableSearch ... />}
//           {showColumnHeaders && <WidgetTableHeader columns={...} />}
//         </>
//       }
//       onRefresh={refetch}
//       refreshing={isRefetching}
//       emptyState={<WidgetTableMessage>Nenhum item.</WidgetTableMessage>}
//     />
//   </WidgetCard>

import { type ReactElement } from "react";
import {
  FlatList,
  RefreshControl,
  View,
  type ListRenderItem,
} from "react-native";
import { useTheme } from "@/lib/theme";
import { densityClasses, type Density } from "./_shared";

export interface WidgetTableListProps<T> {
  data: ReadonlyArray<T>;
  keyExtractor: (item: T, index: number) => string;
  renderItem: ListRenderItem<T>;
  /** Sticky header content. Typical: search box + column headers. */
  ListHeaderComponent?: ReactElement | null;
  /** Optional empty state — usually <WidgetTableMessage>...</WidgetTableMessage>. */
  emptyState?: ReactElement | null;
  /** Pull-to-refresh handler. The widget hook's `refetch` works directly. */
  onRefresh?: () => Promise<unknown> | void;
  /** Drive the spinner from the hook's `isFetching` / `isRefetching`. */
  refreshing?: boolean;
  /** Density for spacing — used to size internal padding. Defaults
   *  comfortable. */
  density?: Density;
  /** Extra bottom padding so the last row isn't flush against the footer. */
  paddingBottom?: number;
}

export function WidgetTableList<T>({
  data,
  keyExtractor,
  renderItem,
  ListHeaderComponent,
  emptyState,
  onRefresh,
  refreshing,
  density = "comfortable",
  paddingBottom,
}: WidgetTableListProps<T>) {
  const { colors } = useTheme();
  const { rowPaddingY } = densityClasses(density);

  return (
    <FlatList
      data={data as T[]}
      keyExtractor={keyExtractor}
      renderItem={renderItem}
      // Sticky header floats above rows on iOS; on Android it scrolls
      // normally. The default works for the table use case.
      stickyHeaderIndices={ListHeaderComponent ? [0] : undefined}
      ListHeaderComponent={
        ListHeaderComponent ? (
          // Wrap in a View with the card background so a sticky header
          // doesn't paint translucent over scrolled rows.
          <View style={{ backgroundColor: colors.card }}>
            {ListHeaderComponent}
          </View>
        ) : null
      }
      ListEmptyComponent={emptyState}
      contentContainerStyle={{
        paddingBottom: paddingBottom ?? rowPaddingY,
        flexGrow: 1,
      }}
      // Performance knobs. Default windowSize=21 is overkill for a 200-row
      // dashboard table; 5 keeps just one screen of overscan in either
      // direction. removeClippedSubviews helps on Android only — iOS
      // ignores it but the prop is harmless.
      removeClippedSubviews
      windowSize={5}
      initialNumToRender={10}
      // Important for nested-scroll behavior: tells the framework this
      // FlatList is OK to nest inside a parent ScrollView (the page
      // ScrollView) when the user reaches its bounds.
      nestedScrollEnabled
      refreshControl={
        onRefresh ? (
          <RefreshControl
            refreshing={!!refreshing}
            onRefresh={() => {
              void onRefresh();
            }}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        ) : undefined
      }
      showsVerticalScrollIndicator={false}
    />
  );
}
