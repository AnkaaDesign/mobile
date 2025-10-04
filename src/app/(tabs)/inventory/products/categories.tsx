import { useEffect } from "react";
import { useRouter } from "expo-router";

export default function CategoriesScreen() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to the list screen
    router.replace("/inventory/products/categories/list");
  }, [router]);

  // Return null since we're redirecting immediately
  return null;
}
