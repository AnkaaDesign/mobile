import React from "react";
import { View } from "react-native";
import { Header } from "@/components/ui/header";

export default function InventoryPpeScreen() {
  return (
    <View className="flex-1 bg-background">
      <Header title="EPIs - Equipamentos de Proteção Individual" showBackButton={false} />
    </View>
  );
}
