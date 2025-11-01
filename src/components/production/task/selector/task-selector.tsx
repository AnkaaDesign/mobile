import { View, ViewStyle } from "react-native";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ThemedText } from "@/components/ui/themed-text";

interface TaskSelectorProps {
  value?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  style?: ViewStyle;
}

export function TaskSelector({
  value,
  onValueChange,
  placeholder = "Selecione uma opção",
  disabled = false,
  style,
}: TaskSelectorProps) {

  return (
    <View style={style}>
      <Select value={value || ""} onValueChange={onValueChange} disabled={disabled}>
        <SelectTrigger>
          <SelectValue placeholder={placeholder}>
            <ThemedText>{value || placeholder}</ThemedText>
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {/* Add select items here */}
          <SelectItem value="option1">
            <ThemedText>Opção 1</ThemedText>
          </SelectItem>
        </SelectContent>
      </Select>
    </View>
  );
}