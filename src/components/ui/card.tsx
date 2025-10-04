import * as React from "react";
import { Text, type TextProps, View, type ViewProps, ViewStyle, TextStyle, StyleProp } from "react-native";
import { useTheme } from "@/lib/theme";
import { borderRadius, shadow, spacing, fontSize, fontWeight, lineHeight } from "@/constants/design-system";
import { extendedColors } from "@/lib/theme/extended-colors";

interface CardProps extends ViewProps {
  style?: StyleProp<ViewStyle>;
  level?: number;
}

// Card level context to track nesting
const CardLevelContext = React.createContext(0);

function Card({ style, level, children, ...props }: CardProps) {
  const { colors, isDark } = useTheme();
  const parentLevel = React.useContext(CardLevelContext);
  const currentLevel = level ?? parentLevel + 1;

  // Get background color based on nesting level
  const getCardBackground = () => {
    if (currentLevel === 1) {
      return colors.card; // Standard card background
    } else if (currentLevel === 2) {
      return isDark ? extendedColors.neutral[800] : extendedColors.neutral[100 as keyof typeof neutral]; // Nested card
    } else {
      // Level 3+ uses same as level 2 to avoid excessive contrast
      return isDark ? extendedColors.neutral[800] : extendedColors.neutral[100 as keyof typeof neutral];
    }
  };

  const cardStyles: ViewStyle = {
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: isDark ? extendedColors.neutral[700] : extendedColors.neutral[200],
    backgroundColor: getCardBackground(),
    ...shadow.md,
    ...style,
  };

  return (
    <CardLevelContext.Provider value={currentLevel}>
      <View style={cardStyles} {...props}>
        {children}
      </View>
    </CardLevelContext.Provider>
  );
}

Card.displayName = "Card";

interface CardHeaderProps extends ViewProps {
  style?: StyleProp<ViewStyle>;
}

function CardHeader({ style, children, ...props }: CardHeaderProps) {
  const { colors, isDark } = useTheme();

  const headerStyles: ViewStyle = {
    flexDirection: "column",
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: isDark ? extendedColors.neutral[800] : extendedColors.neutral[100],
    ...style,
  };

  return (
    <View style={headerStyles} {...props}>
      {children}
    </View>
  );
}

interface CardTitleProps extends TextProps {
  style?: StyleProp<TextStyle>;
}

function CardTitle({ style, children, ...props }: CardTitleProps) {
  const { colors } = useTheme();

  const titleStyles: TextStyle = {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    lineHeight: lineHeight.lg,
    color: colors.cardForeground,
    ...style,
  };

  return (
    <Text accessible accessibilityRole="header" style={titleStyles} {...props}>
      {children}
    </Text>
  );
}

interface CardDescriptionProps extends TextProps {
  style?: StyleProp<TextStyle>;
}

function CardDescription({ style, children, ...props }: CardDescriptionProps) {
  const { colors } = useTheme();

  const descriptionStyles: TextStyle = {
    fontSize: fontSize.sm,
    lineHeight: lineHeight.sm,
    color: colors.mutedForeground,
    ...style,
  };

  return (
    <Text style={descriptionStyles} {...props}>
      {children}
    </Text>
  );
}

interface CardContentProps extends ViewProps {
  style?: StyleProp<ViewStyle>;
}

function CardContent({ style, children, ...props }: CardContentProps) {
  const contentStyles: ViewStyle = {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    ...style,
  };

  return (
    <View style={contentStyles} {...props}>
      {children}
    </View>
  );
}

interface CardFooterProps extends ViewProps {
  style?: StyleProp<ViewStyle>;
  flexDirection?: "row" | "column";
}

function CardFooter({ style, flexDirection = "column", children, ...props }: CardFooterProps) {
  const { colors, isDark } = useTheme();

  const footerStyles: ViewStyle = {
    flexDirection,
    alignItems: flexDirection === "column" ? "stretch" : "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderTopColor: isDark ? extendedColors.neutral[800] : extendedColors.neutral[100],
    // Removed backgroundColor to maintain consistent card background
    ...style,
  };

  return (
    <View style={footerStyles} {...props}>
      {children}
    </View>
  );
}

export { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle, CardLevelContext };
