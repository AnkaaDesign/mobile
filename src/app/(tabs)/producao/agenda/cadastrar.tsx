import { Alert } from "react-native";

import { TaskFormWithProvider } from "@/components/production/task/form/task-form-with-provider";
import {
  useTaskMutations,
  useTaskBatchMutations,
  useScreenReady,
  useFormScreenKey,
  useAuth,
} from "@/hooks";
import { createTaskQuote } from "@/api-client";
import { useNav } from "@/contexts/nav";
import { PrivilegeGate } from "@/components/auth/privilege-gate";
import { SECTOR_PRIVILEGES, SERVICE_ORDER_STATUS } from "@/constants";

/**
 * Build the list of plate × serialNumber combinations for batch creation.
 * Mirrors web's task-create-form expansion (lines ~433-451):
 *   - plates AND serials  → cartesian product (plate × serial)
 *   - plates only         → one task per plate
 *   - serials only        → one task per serial
 *   - neither             → a single task with no plate/serial
 */
function buildCombinations(
  plates: string[],
  serialNumbers: number[],
): { plate?: string; serialNumber?: string }[] {
  const combinations: { plate?: string; serialNumber?: string }[] = [];
  if (plates.length > 0 && serialNumbers.length > 0) {
    for (const plate of plates) {
      for (const serialNumber of serialNumbers) {
        combinations.push({ plate, serialNumber: String(serialNumber) });
      }
    }
  } else if (plates.length > 0) {
    for (const plate of plates) {
      combinations.push({ plate });
    }
  } else if (serialNumbers.length > 0) {
    for (const serialNumber of serialNumbers) {
      combinations.push({ serialNumber: String(serialNumber) });
    }
  } else {
    combinations.push({});
  }
  return combinations;
}

function CreateAgendaTaskInner() {
  const nav = useNav();
  const { user } = useAuth();
  const { createAsync, isLoading: isCreating } = useTaskMutations();
  const { batchCreateAsync, isLoading: isBatchCreating } = useTaskBatchMutations();

  const isLoading = isCreating || isBatchCreating;
  useScreenReady(!isLoading);
  const formKey = useFormScreenKey();

  const userPrivilege = user?.sector?.privileges;
  const canCreateQuote =
    userPrivilege === SECTOR_PRIVILEGES.COMMERCIAL ||
    userPrivilege === SECTOR_PRIVILEGES.ADMIN;

  // Auto-create a minimal TaskQuote for a freshly-created task when it has a customer.
  // Only COMMERCIAL/ADMIN may create quotes (API permission). Non-blocking — failures
  // are swallowed since the task itself was created successfully. Mirrors web ~490-510.
  const maybeCreateQuote = async (taskId?: string, customerId?: string | null) => {
    if (!taskId || !customerId || !canCreateQuote) return;
    try {
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30);
      await createTaskQuote({
        taskId,
        subtotal: 0,
        total: 0,
        expiresAt: expiresAt.toISOString(),
        customerConfigs: [{ customerId, subtotal: 0, total: 0 }],
        services: [{ description: "A definir", amount: 0 }],
      } as any);
    } catch {
      // Quote creation failure is non-blocking.
    }
  };

  const handleSubmit = async (data: any) => {
    try {
      const {
        plates: rawPlates,
        serialNumbers: rawSerialNumbers,
        // Pull truck off so we can rebuild it per-combination with the plate.
        truck: incomingTruck,
        // Strip UI-only batch fields from the per-task payload.
        ...rest
      } = data;

      const plates: string[] = Array.isArray(rawPlates) ? rawPlates : [];
      const serialNumbers: number[] = Array.isArray(rawSerialNumbers) ? rawSerialNumbers : [];

      const artworkStatuses = data.artworkStatuses;

      // The form holds truck.category / truck.implementType (the real fields).
      // category/implementType belong on the truck relation, NOT the task root.
      const baseTruck = incomingTruck || {};
      const hasTruckCategory = !!baseTruck.category;
      const hasTruckImplement = !!baseTruck.implementType;

      // Build a single task payload for one plate/serial combination.
      const buildTaskData = (plate?: string, serialNumber?: string) => {
        // Only attach a truck object when there's something meaningful to set
        // (plate, category, implementType, or layout data). Otherwise omit it.
        const truckFields: Record<string, any> = { ...baseTruck };
        if (plate) truckFields.plate = plate;
        const hasTruck =
          !!plate ||
          hasTruckCategory ||
          hasTruckImplement ||
          !!baseTruck.leftSideLayout ||
          !!baseTruck.rightSideLayout ||
          !!baseTruck.backSideLayout;

        const taskData: any = {
          ...rest,
          ...(serialNumber ? { serialNumber } : {}),
          ...(hasTruck ? { truck: truckFields } : {}),
        };
        // artworkStatuses is a passthrough field (File id -> DRAFT/APPROVED/REPROVED).
        // It is not part of the zod schema but the API reads it off the payload.
        if (artworkStatuses && Object.keys(artworkStatuses).length > 0) {
          taskData.artworkStatuses = artworkStatuses;
        }
        return taskData;
      };

      const combinations = buildCombinations(plates, serialNumbers);

      // ── Single task ──────────────────────────────────────────────────────
      if (combinations.length === 1) {
        const { plate, serialNumber } = combinations[0];
        const payload = buildTaskData(plate, serialNumber);
        const result = await createAsync(payload);
        if (result.success && result.data) {
          await maybeCreateQuote(result.data.id, result.data.customerId ?? rest.customerId);
          nav.goBack();
        } else {
          Alert.alert(
            "Erro ao criar tarefa",
            result?.message || "Não foi possível criar a tarefa. Tente novamente.",
          );
        }
        return;
      }

      // ── Batch (plates × serials) ─────────────────────────────────────────
      const tasks = combinations.map(({ plate, serialNumber }) =>
        buildTaskData(plate, serialNumber),
      );
      const result = await batchCreateAsync({ tasks });

      const createdTasks = result.data?.success ?? [];
      const failedCount = result.data?.failed?.length ?? 0;
      const successCount = createdTasks.length;

      if (successCount > 0) {
        // Auto-create quotes for each successfully-created task that has a customer.
        await Promise.all(
          createdTasks.map((t: any) => maybeCreateQuote(t.id, t.customerId ?? rest.customerId)),
        );

        if (failedCount > 0) {
          Alert.alert(
            "Tarefas criadas parcialmente",
            `${successCount} tarefa(s) criada(s), mas ${failedCount} falharam.`,
          );
        }
        nav.goBack();
      } else {
        Alert.alert(
          "Erro ao criar tarefas",
          result?.message || "Não foi possível criar as tarefas. Tente novamente.",
        );
      }
    } catch (error: any) {
      console.error("[CreateAgendaTask] Error creating task:", error);
      Alert.alert(
        "Erro ao criar tarefa",
        "Ocorreu um erro inesperado. Tente novamente.",
      );
    }
  };

  const handleCancel = () => {
    nav.goBack();
  };

  return (
    <TaskFormWithProvider
      key={formKey}
      mode="create"
      onSubmit={handleSubmit}
      onCancel={handleCancel}
      isSubmitting={isLoading}
    />
  );
}

export default function CreateAgendaTaskScreen() {
  return (
    <PrivilegeGate
      required={{
        any: [
          SECTOR_PRIVILEGES.ADMIN,
          SECTOR_PRIVILEGES.COMMERCIAL,
          SECTOR_PRIVILEGES.LOGISTIC,
          SECTOR_PRIVILEGES.PRODUCTION_MANAGER,
        ],
      }}
      fallback="unauthorized"
    >
      <CreateAgendaTaskInner />
    </PrivilegeGate>
  );
}
