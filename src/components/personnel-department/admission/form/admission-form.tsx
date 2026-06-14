// admission-form.tsx (mobile)
// Mode dispatcher used by the route screens:
//   - create → AdmissionNewUserForm (collaborator registration + vínculo + docs)
//   - update → AdmissionEditForm (admission-level fields only: hireDate / notes)

import { AdmissionNewUserForm } from "./admission-new-user-form";
import { AdmissionEditForm } from "./admission-edit-form";
import type { Admission } from "@/types";

interface AdmissionFormProps {
  mode: "create" | "update";
  admission?: Admission;
  onSuccess?: (id?: string) => void;
  onCancel?: () => void;
}

export function AdmissionForm({ mode, admission, onSuccess, onCancel }: AdmissionFormProps) {
  if (mode === "update" && admission) {
    return <AdmissionEditForm admission={admission} onSuccess={onSuccess} onCancel={onCancel} />;
  }
  return <AdmissionNewUserForm onSuccess={onSuccess} onCancel={onCancel} />;
}
