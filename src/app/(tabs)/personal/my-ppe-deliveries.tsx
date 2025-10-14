import React, { useState } from "react";
import { View } from "react-native";
import { router } from "expo-router";
import { Header } from "@/components/ui/header";
import { Button } from "@/components/ui/button";
import Icon from "@/components/ui/icon";
import { PersonalPpeDeliveryList } from "@/components/personal/ppe-delivery/personal-ppe-delivery-list";
import { PpeRequestModal } from "@/components/personal/ppe-delivery/ppe-request-modal";

export default function MyPPEDeliveriesScreen() {
  const [isRequestModalVisible, setIsRequestModalVisible] = useState(false);

  return (
    <View className="flex-1 bg-background">
      <Header
        title="Minhas Entregas de EPI"
        showBackButton={false}
        rightAction={
          <Button
            variant="ghost"
            size="icon"
            onPress={() => setIsRequestModalVisible(true)}
          >
            <Icon name="plus" size={24} />
          </Button>
        }
      />
      <PersonalPpeDeliveryList />
      <PpeRequestModal
        visible={isRequestModalVisible}
        onClose={() => setIsRequestModalVisible(false)}
        onSuccess={() => {
          setIsRequestModalVisible(false);
        }}
      />
    </View>
  );
}
