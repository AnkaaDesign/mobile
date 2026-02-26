import { CollaboratorForm } from "@/components/administration/collaborator/form/collaborator-form";
import { useScreenReady } from '@/hooks/use-screen-ready';
import { useFormScreenKey } from "@/hooks/use-form-screen-key";

export default function CreateCollaboratorScreen() {
  useScreenReady();
  const formKey = useFormScreenKey();
  return <CollaboratorForm key={formKey} mode="create" />;
}
