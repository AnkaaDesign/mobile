import * as React from "react";
import { View, ViewStyle, Dimensions, DimensionValue } from "react-native";
import { useTheme } from "@/lib/theme";
import { spacing } from "@/constants/design-system";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

interface GridProps {
  children: React.ReactNode;
  columns?: number;
  gap?: number;
  horizontal?: boolean;
  style?: ViewStyle;
}

interface GridItemProps {
  children: React.ReactNode;
  span?: number;
  style?: ViewStyle;
}

interface ResponsiveGridProps {
  children: React.ReactNode;
  minItemWidth?: number;
  maxColumns?: number;
  gap?: number;
  style?: ViewStyle;
}

interface MasonryGridProps {
  children: React.ReactNode;
  columns?: number;
  gap?: number;
  style?: ViewStyle;
}

// Basic Grid component
const Grid: React.FC<GridProps> = ({
  children,
  columns = 2,
  gap = spacing.md,
  horizontal = false,
  style
}) => {
  const { colors } = useTheme();

  const gridStyle: ViewStyle = {
    flexDirection: horizontal ? "column" : "row",
    flexWrap: "wrap",
    gap: gap,
    backgroundColor: colors.background,
    ...style,
  };

  const childArray = React.Children.toArray(children);

  return (
    <View style={gridStyle}>
      {childArray.map((child, index) => {
        if (React.isValidElement(child)) {
          const itemWidth = horizontal
            ? "100%"
            : `${(100 - (gap * (columns - 1))) / columns}%`;

          const itemStyle: ViewStyle = {
            width: itemWidth as DimensionValue,
            ...(horizontal && { height: `${100 / columns}%` as DimensionValue }),
          };

          return (
            <View
              key={index}
              style={itemStyle}
            >
              {child}
            </View>
          );
        }
        return child;
      })}
    </View>
  );
};

// Grid Item component (for more control)
const GridItem: React.FC<GridItemProps> = ({
  children,
  span = 1,
  style
}) => {
  const itemStyle: ViewStyle = {
    flex: span,
    ...style,
  };

  return <View style={itemStyle}>{children}</View>;
};

// Responsive Grid component that adjusts columns based on screen size
const ResponsiveGrid: React.FC<ResponsiveGridProps> = ({
  children,
  minItemWidth = 150,
  maxColumns = 4,
  gap = spacing.md,
  style
}) => {
  const { colors } = useTheme();

  // Calculate optimal number of columns based on screen width and min item width
  const calculateColumns = React.useCallback(() => {
    const availableWidth = SCREEN_WIDTH - (gap * 2); // Account for container padding
    const columnsFromWidth = Math.floor(availableWidth / (minItemWidth + gap));
    return Math.min(Math.max(1, columnsFromWidth), maxColumns);
  }, [minItemWidth, gap, maxColumns]);

  const [columns, setColumns] = React.useState(calculateColumns);

  React.useEffect(() => {
    const updateColumns = () => {
      setColumns(calculateColumns());
    };

    const subscription = Dimensions.addEventListener('change', updateColumns);
    return () => subscription?.remove();
  }, [calculateColumns]);

  const gridStyle: ViewStyle = {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: gap,
    backgroundColor: colors.background,
    ...style,
  };

  const childArray = React.Children.toArray(children);

  return (
    <View style={gridStyle}>
      {childArray.map((child, index) => {
        if (React.isValidElement(child)) {
          const itemWidth = `${(100 - (gap * (columns - 1))) / columns}%`;
          const itemStyle: ViewStyle = {
            width: itemWidth as DimensionValue,
          };

          return (
            <View
              key={index}
              style={itemStyle}
            >
              {child}
            </View>
          );
        }
        return child;
      })}
    </View>
  );
};

// Masonry Grid component for items with varying heights
const MasonryGrid: React.FC<MasonryGridProps> = ({
  children,
  columns = 2,
  gap = spacing.md,
  style
}) => {
  const { colors } = useTheme();
  const [columnHeights] = React.useState<number[]>(
    new Array(columns).fill(0)
  );

  const gridStyle: ViewStyle = {
    flexDirection: "row",
    backgroundColor: colors.background,
    ...style,
  };

  const columnStyle: ViewStyle = {
    flex: 1,
    marginHorizontal: gap / 2,
  };

  const childArray = React.Children.toArray(children);

  // Distribute children across columns
  const columnChildren: React.ReactNode[][] = Array.from(
    { length: columns },
    () => []
  );

  childArray.forEach((child, index) => {
    const shortestColumnIndex = columnHeights.indexOf(Math.min(...columnHeights));
    columnChildren[shortestColumnIndex].push(
      <View key={index} style={{ marginBottom: gap }}>
        {child}
      </View>
    );
    // Estimate height increase (this is a rough estimate)
    columnHeights[shortestColumnIndex] += 200; // Default estimated height
  });

  return (
    <View style={gridStyle}>
      {columnChildren.map((children, columnIndex) => (
        <View key={columnIndex} style={columnStyle}>
          {children}
        </View>
      ))}
    </View>
  );
};

// Grid Container for layout composition
interface GridContainerProps {
  children: React.ReactNode;
  padding?: number;
  style?: ViewStyle;
}

const GridContainer: React.FC<GridContainerProps> = ({
  children,
  padding = spacing.md,
  style
}) => {
  const { colors } = useTheme();

  const containerStyle: ViewStyle = {
    flex: 1,
    padding: padding,
    backgroundColor: colors.background,
    ...style,
  };

  return <View style={containerStyle}>{children}</View>;
};

// Grid Row for horizontal layouts
interface GridRowProps {
  children: React.ReactNode;
  gap?: number;
  align?: "flex-start" | "center" | "flex-end" | "stretch";
  justify?: "flex-start" | "center" | "flex-end" | "space-between" | "space-around" | "space-evenly";
  style?: ViewStyle;
}

const GridRow: React.FC<GridRowProps> = ({
  children,
  gap = spacing.sm,
  align = "center",
  justify = "flex-start",
  style
}) => {
  const rowStyle: ViewStyle = {
    flexDirection: "row",
    alignItems: align,
    justifyContent: justify,
    gap: gap,
    ...style,
  };

  return <View style={rowStyle}>{children}</View>;
};

// Grid Column for vertical layouts
interface GridColumnProps {
  children: React.ReactNode;
  gap?: number;
  align?: "flex-start" | "center" | "flex-end" | "stretch";
  justify?: "flex-start" | "center" | "flex-end" | "space-between" | "space-around" | "space-evenly";
  style?: ViewStyle;
}

const GridColumn: React.FC<GridColumnProps> = ({
  children,
  gap = spacing.sm,
  align = "stretch",
  justify = "flex-start",
  style
}) => {
  const columnStyle: ViewStyle = {
    flexDirection: "column",
    alignItems: align,
    justifyContent: justify,
    gap: gap,
    ...style,
  };

  return <View style={columnStyle}>{children}</View>;
};

export {
  Grid,
  GridItem,
  ResponsiveGrid,
  MasonryGrid,
  GridContainer,
  GridRow,
  GridColumn
};
