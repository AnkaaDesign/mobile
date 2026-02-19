import { View, Text } from "react-native";
import { useScreenReady } from '@/hooks/use-screen-ready';

export default function CreatePPEScheduleScreen() {
  useScreenReady();
  return (
    <View className="flex-1 justify-center items-center">
      <Text>Create PPE Schedule - Under Construction</Text>
    </View>
  );
}
