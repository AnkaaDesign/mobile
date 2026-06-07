// FormData Helper Utilities (Mobile)
// Builds multipart FormData payloads for endpoints that accept file uploads.
//
// Mirrors web/src/utils/form-data-helper.ts so the API's multipart body parsing
// (ZodValidationPipe.fixArrays) reassembles the same structure:
// - scalar values -> String(value)
// - null          -> "" (backend converts empty -> null for nullable fields)
// - object/array  -> JSON.stringify (backend JSON.parses + fixArrays)
// - files         -> appended under their field name as RN { uri, name, type }
//
// Difference from web: React Native FormData requires file parts to be plain
// objects of the form { uri, name, type } (matching the working supplier/logo
// upload pattern), not browser File instances.

import type { FilePickerItem } from "@/components/ui/file-picker";

/** A file selected via the mobile FilePicker that has not yet been uploaded. */
export type LocalFile = FilePickerItem;

function appendFile(formData: FormData, fieldName: string, file: LocalFile) {
  formData.append(fieldName, {
    uri: file.uri,
    name: file.name,
    type: file.type || file.mimeType || "application/octet-stream",
  } as any);
}

/**
 * Generic builder mirroring web's createFormDataWithContext (without the
 * file-organization context, which mobile does not compute).
 */
export function createFormDataWithFiles(
  data: Record<string, any>,
  files: Record<string, LocalFile[] | LocalFile | null | undefined>,
): FormData {
  const formData = new FormData();

  // Regular form data
  Object.entries(data).forEach(([key, value]) => {
    // Explicitly handle null -> empty string so the backend clears the field
    if (value === null) {
      formData.append(key, "");
      return;
    }

    if (value === undefined) return;

    if (Array.isArray(value)) {
      if (value.length === 0) {
        formData.append(`${key}_empty`, "true");
        return;
      }
      const hasObjects = value.some(
        (item) => item !== null && item !== undefined && typeof item === "object",
      );
      if (hasObjects) {
        // Serialize as a single JSON string so backend fixArrays() can parse it
        formData.append(key, JSON.stringify(value));
      } else {
        value.forEach((item, index) => {
          if (item !== null && item !== undefined) {
            formData.append(`${key}[${index}]`, String(item));
          }
        });
      }
    } else if (typeof value === "object") {
      formData.append(key, JSON.stringify(value));
    } else {
      formData.append(key, String(value));
    }
  });

  // Files
  Object.entries(files).forEach(([fieldName, fileOrFiles]) => {
    if (!fileOrFiles) return;
    const filesArray = Array.isArray(fileOrFiles) ? fileOrFiles : [fileOrFiles];
    filesArray.forEach((file) => {
      if (file?.uri) appendFile(formData, fieldName, file);
    });
  });

  return formData;
}

/**
 * Helper for External Withdrawal forms (create + update).
 * Files map to the multipart fields accepted by the API:
 *   receipts -> recibo, invoices -> nota fiscal.
 */
export function createWithdrawalFormData(
  data: Record<string, any>,
  files: {
    receipts?: LocalFile[];
    invoices?: LocalFile[];
  },
): FormData {
  return createFormDataWithFiles(data, {
    receipts: files.receipts,
    invoices: files.invoices,
  });
}
