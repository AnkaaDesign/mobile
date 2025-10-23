import { useEffect } from "react";
import { useRouter } from "expo-router";

export default function BrandsScreen() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to the list screen
    router.replace("/inventory/products/brands/list");
  }, [router]);

  // Return null since we're redirecting immediately
  return null;
}
