import React from "react";
import { View, Text, TouchableOpacity, ViewStyle, TextStyle } from "react-native";
import { Icon } from "./icon";
import { Card, CardContent } from "./card";
import { Badge } from "./badge";

export interface DashboardCardProps {
  title: string;
  value: number | string;
  unit?: string;
  trend?: "up" | "down" | "stable";
  change?: number;
  icon?: string;
  color?: string;
  style?: ViewStyle;
  onPress?: () => void;
  badge?: {
    text: string;
    variant?: "default" | "secondary" | "destructive" | "outline";
  };
}

export const DashboardCard: React.FC<DashboardCardProps> = ({ title, value, unit = "", trend, change, icon, color = "#16a34a", style, onPress, badge }) => {
  const getTrendIcon = () => {
    switch (trend) {
      case "up":
        return "trending-up";
      case "down":
        return "trending-down";
      default:
        return "minus";
    }
  };

  const getTrendColor = () => {
    switch (trend) {
      case "up":
        return "#16a34a"; // green
      case "down":
        return "#ef4444"; // red
      default:
        return "#737373"; // neutral
    }
  };

  const cardContentStyles: ViewStyle = {
    padding: 16,
  };

  const headerContainerStyles: ViewStyle = {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  };

  const titleContainerStyles: ViewStyle = {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  };

  const titleStyles: TextStyle = {
    fontSize: 14,
    fontWeight: "500",
    color: "#737373",
    flex: 1,
  };

  const valueStyles: TextStyle = {
    fontSize: 24,
    fontWeight: "700",
    color: "#171717",
  };

  const changeStyles: TextStyle = {
    fontSize: 12,
    marginTop: 4,
    color: getTrendColor(),
  };

  const iconContainerStyles: ViewStyle = {
    flexDirection: "row",
    alignItems: "center",
  };

  const CardComponent = onPress ? TouchableOpacity : View;

  return (
    <CardComponent onPress={onPress} style={style}>
      <Card style={{ marginBottom: 16 }}>
        <CardContent style={cardContentStyles}>
          <View style={headerContainerStyles}>
            <View style={titleContainerStyles}>
              {icon && (
                <View style={{ marginRight: 8 }}>
                  <Icon name={icon} size={20} color="#737373" />
                </View>
              )}
              <Text style={titleStyles} numberOfLines={1}>
                {title}
              </Text>
            </View>
            <View style={iconContainerStyles}>
              {trend && <Icon name={getTrendIcon()} size={16} color={getTrendColor()} />}
              {badge && (
                <View style={{ marginLeft: 8 }}>
                  <Badge variant={badge.variant}>{badge.text}</Badge>
                </View>
              )}
            </View>
          </View>

          <Text style={valueStyles}>
            {typeof value === "number" ? value.toLocaleString("pt-BR") : value}
            {unit}
          </Text>

          {change !== undefined && (
            <Text style={changeStyles}>
              {change > 0 ? "+" : ""}
              {change}% vs anterior
            </Text>
          )}
        </CardContent>
      </Card>
    </CardComponent>
  );
};

export interface QuickActionCardProps {
  title: string;
  icon: string;
  color?: string;
  onPress: () => void;
  style?: ViewStyle;
  badge?: {
    text: string;
    variant?: "default" | "secondary" | "destructive" | "outline";
  };
}

export const QuickActionCard: React.FC<QuickActionCardProps> = ({ title, icon, color = "#16a34a", onPress, style, badge }) => {
  const cardStyles: ViewStyle = {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#d4d4d4",
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    // Shadow
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    ...style,
  };

  const contentStyles: ViewStyle = {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  };

  const iconStyles: ViewStyle = {
    marginRight: 8,
  };

  const titleStyles: TextStyle = {
    fontSize: 14,
    fontWeight: "500",
    color: "#262626",
    textAlign: "center",
  };

  const badgeContainerStyles: ViewStyle = {
    position: "absolute",
    top: -4,
    right: -4,
  };

  return (
    <TouchableOpacity onPress={onPress} style={cardStyles}>
      <View style={contentStyles}>
        <View style={iconStyles}>
          <Icon name={icon} size={32} color={color} />
        </View>
        <Text style={titleStyles}>{title}</Text>
        {badge && (
          <View style={badgeContainerStyles}>
            <Badge variant={badge.variant}>{badge.text}</Badge>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};
