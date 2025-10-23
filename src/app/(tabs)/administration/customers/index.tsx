import { useEffect } from "react";
import { router } from "expo-router";

export default function AdministrationCustomersScreen() {
  useEffect(() => {
    // Redirect to customers list page
    router.replace("/(tabs)/administration/customers/list");
  }, []);

  return null;
}
