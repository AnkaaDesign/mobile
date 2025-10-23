import { useRouter } from "expo-router";
import { useEffect } from "react";

export default function ProductsScreen() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to the products list
    router.replace("/inventory/products/list");
  }, [router]);

  return null;
}
