import { useState } from "react";
import { View } from "react-native";
import { router } from "expo-router";
import { Header } from "@/components/ui/header";
import { PpeRequestModal } from "@/components/personal/ppe-delivery/ppe-request-modal";

export default function RequestPPEScreen() {
  const [isModalVisible, setIsModalVisible] = useState(true);

  return (
    <View className="flex-1 bg-background">
      <Header title="Solicitar EPI" showBackButton={true} />
      <PpeRequestModal
        visible={isModalVisible}
        onClose={() => {
          setIsModalVisible(false);
          router.back();
        }}
        onSuccess={() => {
          setIsModalVisible(false);
          router.back();
        }}
      />
    </View>
  );
}
