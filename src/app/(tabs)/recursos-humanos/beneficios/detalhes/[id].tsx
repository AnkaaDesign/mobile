import { View, StyleSheet, Alert } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { IconHeartHandshake } from "@tabler/icons-react-native";

import { DetailScreen } from "@/components/screens/detail-screen";
import { ChangelogTimeline } from "@/components/ui/changelog-timeline";
import { spacing } from "@/constants/design-system";
import { CHANGE_LOG_ENTITY_TYPE, SECTOR_PRIVILEGES, BENEFIT_ENROLLMENT_STATUS } from "@/constants";
import {
  useUserBenefit,
  useUserBenefitMutations,
  useSuspendUserBenefit,
  useReactivateUserBenefit,
  useTerminateUserBenefit,
  useAdvanceUserBenefitInstallment,
} from "@/hooks/useUserBenefit";
import {
  UserBenefitUserCard,
  UserBenefitBenefitCard,
  UserBenefitValuesCard,
  UserBenefitDatesCard,
  UserBenefitDeclarationCard,
} from "@/components/personnel-department/user-benefit/detail";
import type { UserBenefit } from "@/types";
import type { PageAction } from "@/components/ui/page-header";

export default function UserBenefitDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const userBenefitId = id || "";

  const { deleteMutation } = useUserBenefitMutations();
  const suspendMutation = useSuspendUserBenefit();
  const reactivateMutation = useReactivateUserBenefit();
  const terminateMutation = useTerminateUserBenefit();
  const advanceMutation = useAdvanceUserBenefitInstallment();

  const query = useUserBenefit(userBenefitId, {
    include: {
      // remunerations = salário-base, usado pelo cálculo da parte do
      // colaborador no Vale Transporte (% do salário)
      user: { include: { position: { include: { remunerations: true } }, sector: true } },
      benefit: true,
      declarationFile: true,
    },
    enabled: !!userBenefitId,
  });

  const buildActions = (userBenefit: UserBenefit): PageAction[] => {
    const actions: PageAction[] = [];
    const status = userBenefit.status;
    const canSuspend = status === BENEFIT_ENROLLMENT_STATUS.ACTIVE;
    const canReactivate = status === BENEFIT_ENROLLMENT_STATUS.SUSPENDED;
    const canTerminate = status === BENEFIT_ENROLLMENT_STATUS.ACTIVE || status === BENEFIT_ENROLLMENT_STATUS.SUSPENDED;
    const canAdvanceInstallment =
      status === BENEFIT_ENROLLMENT_STATUS.ACTIVE &&
      userBenefit.totalInstallments != null &&
      (userBenefit.currentInstallment ?? 1) < userBenefit.totalInstallments;

    if (canSuspend) {
      actions.push({
        key: "suspend",
        label: "Suspender",
        icon: "pause",
        onPress: () => suspendMutation.mutate({ id: userBenefitId }),
      });
    }
    if (canReactivate) {
      actions.push({
        key: "reactivate",
        label: "Reativar",
        icon: "play",
        onPress: () => reactivateMutation.mutate({ id: userBenefitId }),
      });
    }
    if (canTerminate) {
      actions.push({
        key: "terminate",
        label: "Encerrar",
        icon: "xCircle",
        variant: "destructive",
        onPress: () =>
          Alert.alert(
            "Encerrar adesão",
            "Deseja encerrar esta adesão? A data de encerramento será registrada como hoje.",
            [
              { text: "Cancelar", style: "cancel" },
              {
                text: "Encerrar",
                style: "destructive",
                onPress: () => terminateMutation.mutate({ id: userBenefitId, endDate: new Date() }),
              },
            ],
          ),
      });
    }
    if (canAdvanceInstallment) {
      actions.push({
        key: "advance-installment",
        label: "Avançar parcela",
        icon: "forward",
        onPress: () =>
          Alert.alert(
            "Avançar parcela",
            `Avançar para a próxima parcela do convênio (${userBenefit.currentInstallment ?? 1}/${userBenefit.totalInstallments})?`,
            [
              { text: "Cancelar", style: "cancel" },
              { text: "Avançar", onPress: () => advanceMutation.mutate({ id: userBenefitId }) },
            ],
          ),
      });
    }
    return actions;
  };

  return (
    <DetailScreen
      query={query as any}
      icon={IconHeartHandshake}
      title={(ub: UserBenefit) => `${ub.user?.name || "Colaborador"} — ${ub.benefit?.name || "Benefício"}`}
      privilege={{
        any: [SECTOR_PRIVILEGES.ACCOUNTING, SECTOR_PRIVILEGES.HUMAN_RESOURCES, SECTOR_PRIVILEGES.ADMIN],
      }}
      editRoute={(ub: UserBenefit) => `/recursos-humanos/beneficios/editar/${ub.id}` as any}
      editGuard={{
        field: "status",
        editable: [
          BENEFIT_ENROLLMENT_STATUS.ACTIVE,
          BENEFIT_ENROLLMENT_STATUS.SUSPENDED,
          BENEFIT_ENROLLMENT_STATUS.OPTED_OUT,
        ],
        message: "Adesões encerradas não podem ser editadas.",
      }}
      actions={query.data?.data ? buildActions(query.data.data as UserBenefit) : []}
      deletePrivilege={SECTOR_PRIVILEGES.ADMIN}
      deleteAction={{
        mutation: deleteMutation,
        confirmText: "Tem certeza que deseja excluir esta adesão? Esta ação não pode ser desfeita.",
        successRoute: "/recursos-humanos/beneficios/listar" as any,
      }}
      notFoundFallback={"/recursos-humanos/beneficios/listar" as any}
    >
      {(userBenefit: UserBenefit) => (
        <View style={styles.body}>
          <UserBenefitUserCard userBenefit={userBenefit} />
          <UserBenefitBenefitCard userBenefit={userBenefit} />
          <UserBenefitValuesCard userBenefit={userBenefit} />
          <UserBenefitDatesCard userBenefit={userBenefit} />
          <UserBenefitDeclarationCard userBenefit={userBenefit} />
          <ChangelogTimeline
            entityType={CHANGE_LOG_ENTITY_TYPE.USER_BENEFIT}
            entityId={userBenefit.id}
            entityName={`${userBenefit.user?.name || "Colaborador"} — ${userBenefit.benefit?.name || "Benefício"}`}
            entityCreatedAt={userBenefit.createdAt}
            maxHeight={400}
          />
        </View>
      )}
    </DetailScreen>
  );
}

const styles = StyleSheet.create({
  body: {
    gap: spacing.md,
  },
});
