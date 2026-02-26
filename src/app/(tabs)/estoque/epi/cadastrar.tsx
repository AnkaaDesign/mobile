import { PPEForm } from "@/components/inventory/ppe/form/ppe-form";
import { useScreenReady } from '@/hooks/use-screen-ready';
import { useFormScreenKey } from "@/hooks/use-form-screen-key";

export default function CreatePPEScreen() {
  useScreenReady();
  const formKey = useFormScreenKey();
  return <PPEForm key={formKey} mode="create" />;
}
