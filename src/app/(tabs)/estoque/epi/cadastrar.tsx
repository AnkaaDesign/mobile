import { PPEForm } from "@/components/inventory/ppe/form/ppe-form";
import { useScreenReady } from '@/hooks/use-screen-ready';

export default function CreatePPEScreen() {
  useScreenReady();
  return <PPEForm mode="create" />;
}
