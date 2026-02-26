import { View, Text } from "react-native";
import { useScreenReady } from '@/hooks/use-screen-ready';
import { useFormScreenKey } from "@/hooks/use-form-screen-key";

export default function CreatePPEScheduleScreen() {
  useScreenReady();
  const formKey = useFormScreenKey();
  return (
    <View key={formKey} className="flex-1 justify-center items-center">
      <Text>Create PPE Schedule - Under Construction</Text>
    </View>
  );
}
