
import { TouchableOpacity } from "react-native";
import { Icon } from "./icon";
import { useTheme } from "../../contexts/theme-context";

interface AddButtonProps {
  onPress: () => void;
  open: boolean;
}

export function AddButton({ onPress, open }: AddButtonProps) {
  const { isDark } = useTheme();
  return (
    <>
      {!open && (
        <TouchableOpacity onPress={onPress} className={`w-8 h-8 rounded-full flex justify-center items-center ${isDark ? "bg-neutral-600" : "bg-neutral-800"}`}>
          <Icon name="plus" size={22} color="#e5e5e5" />
        </TouchableOpacity>
      )}
    </>
  );
}
