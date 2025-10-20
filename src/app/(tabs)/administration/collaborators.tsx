import { useEffect } from "react";
import { router } from "expo-router";

export default function AdministrationEmployeesScreen() {
  useEffect(() => {
    // Redirect to employees list page
    router.replace("/(tabs)/administration/employees/list");
  }, []);

  return null;
}
