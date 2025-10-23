import { useEffect } from "react";
import { router } from "expo-router";

export default function AdministrationCollaboratorsScreen() {
  useEffect(() => {
    // Redirect to collaborators list page
    router.replace("/(tabs)/administration/collaborators/list");
  }, []);

  return null;
}
