import { CollaboratorForm } from "@/components/administration/collaborator/form/collaborator-form";
import { useScreenReady } from '@/hooks/use-screen-ready';

export default function CreateCollaboratorScreen() {
  useScreenReady();
  return <CollaboratorForm mode="create" />;
}
