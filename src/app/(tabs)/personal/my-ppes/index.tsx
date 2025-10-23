import React from "react";
import { View } from "react-native";
import { Header } from "@/components/ui/header";
import { MyPpeList } from "@/components/personal/ppe/my-ppe-list";

export default function MyPPEScreen() {
  return (
    <View className="flex-1 bg-background">
      <Header title="Meus EPIs" showBackButton={false} />
      <MyPpeList />
    </View>
  );
}
