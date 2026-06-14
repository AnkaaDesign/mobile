import { useState } from "react";
import { View, StyleSheet, Pressable } from "react-native";
import { IconFileText, IconUpload } from "@tabler/icons-react-native";

import { ThemedText } from "@/components/ui/themed-text";
import { Button } from "@/components/ui/button";
import { DetailCard } from "@/components/ui/detail-page-layout";
import { FilePicker, type FilePickerItem } from "@/components/ui/file-picker";
import { useFileViewer } from "@/components/file";
import { useTheme } from "@/lib/theme";
import { spacing, fontSize, fontWeight, borderRadius } from "@/constants/design-system";

import type { UserBenefit } from "@/types";
import { useUploadUserBenefitDeclaration } from "@/hooks/useUserBenefit";

interface UserBenefitDeclarationCardProps {
  userBenefit: UserBenefit;
}

export function UserBenefitDeclarationCard({ userBenefit }: UserBenefitDeclarationCardProps) {
  const { colors } = useTheme();
  const fileViewer = useFileViewer();
  const uploadMutation = useUploadUserBenefitDeclaration();
  const [pendingFiles, setPendingFiles] = useState<FilePickerItem[]>([]);

  const declarationFile = userBenefit.declarationFile;

  const handleUpload = async () => {
    const file = pendingFiles[0];
    if (!file) return;
    try {
      // RN FormData aceita { uri, name, type } como parte de arquivo.
      await uploadMutation.mutateAsync({
        id: userBenefit.id,
        file: { uri: file.uri, name: file.name, type: file.mimeType || file.type } as any,
      });
      setPendingFiles([]);
    } catch {
      // Erro tratado pelo interceptor do api-client.
    }
  };

  return (
    <DetailCard
      title="Declaração de opção/renúncia (VT) ou autorização de desconto (convênios)"
      icon="file-text"
    >
      <ThemedText style={[styles.description, { color: colors.mutedForeground }]}>
        Anexe o documento assinado pelo colaborador. O envio de um novo arquivo substitui o anterior.
      </ThemedText>

      {declarationFile ? (
        <Pressable
          onPress={() => fileViewer.actions.viewFiles([declarationFile as any], 0)}
          style={[styles.existingFile, { borderColor: colors.border }]}
        >
          <IconFileText size={28} color={colors.mutedForeground} />
          <View style={styles.existingFileInfo}>
            <ThemedText style={[styles.existingFileName, { color: colors.foreground }]} numberOfLines={1}>
              {declarationFile.filename}
            </ThemedText>
            <ThemedText style={[styles.existingFileHint, { color: colors.mutedForeground }]}>Toque para visualizar</ThemedText>
          </View>
        </Pressable>
      ) : null}

      <View style={styles.pickerWrap}>
        <FilePicker
          value={pendingFiles}
          onChange={setPendingFiles}
          maxFiles={1}
          disabled={uploadMutation.isPending}
          placeholder={declarationFile ? "Selecione um arquivo para substituir a declaração atual" : "Selecione o arquivo da declaração"}
          showCamera={false}
          showVideoCamera={false}
        />
      </View>

      {pendingFiles.length > 0 ? (
        <Button
          onPress={handleUpload}
          disabled={uploadMutation.isPending}
          loading={uploadMutation.isPending}
          icon={<IconUpload size={16} color={colors.primaryForeground} />}
          style={styles.uploadButton}
        >
          Enviar Declaração
        </Button>
      ) : null}
    </DetailCard>
  );
}

const styles = StyleSheet.create({
  description: {
    fontSize: fontSize.xs,
    marginBottom: spacing.md,
  },
  existingFile: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    padding: spacing.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
  },
  existingFileInfo: {
    flex: 1,
    minWidth: 0,
  },
  existingFileName: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  existingFileHint: {
    fontSize: fontSize.xs,
  },
  pickerWrap: {
    marginBottom: spacing.md,
  },
  uploadButton: {
    alignSelf: "flex-end",
  },
});
