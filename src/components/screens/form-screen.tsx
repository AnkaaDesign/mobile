/**
 * <FormScreen> — canonical create / edit form template.
 *
 * Encapsulates: PageHeader, FormProvider, FormContainer (keyboard-aware
 * scroll), FormActionBar standardized on onSubmit/submittingLabel,
 * dirty-state cancel guard, navigation-loading overlay during submit
 * (handled by useFormFlow internally), useScreenReady when loadQuery
 * supplied, terminal-status block when editGuard supplied.
 *
 * `cancelConfirm` defaults to true; opt out (e.g. for filter forms) by
 * passing `cancelConfirm={false}`.
 *
 * `submittingLabel` is required (the audit flagged its omission as a
 * source of confusing UX during slow mutations).
 */
import React, { ReactNode, useMemo } from "react";
import {
  View,
  ActivityIndicator,
  StyleSheet,
  TouchableWithoutFeedback,
  Keyboard,
} from "react-native";
import { FormProvider, type UseFormReturn } from "react-hook-form";
import type { UseQueryResult } from "@tanstack/react-query";

import { useTheme } from "@/lib/theme";
import { ThemedView } from "@/components/ui/themed-view";
import { ThemedText } from "@/components/ui/themed-text";
import { ErrorScreen } from "@/components/ui/error-screen";
import { PageHeader } from "@/components/ui/page-header";
import { FormActionBar } from "@/components/forms/FormActionBar";
import { useScreenReady } from "@/hooks/use-screen-ready";
import { useKeyboardAwareScroll } from "@/hooks/useKeyboardAwareScroll";
import {
  KeyboardAwareFormProvider,
  type KeyboardAwareFormContextType,
} from "@/contexts/KeyboardAwareFormContext";
import { PrivilegeGate } from "@/components/auth/privilege-gate";
import { usePrivilegeGate, type PrivilegeReq } from "@/hooks/use-privilege-gate";
import { useStatusGuard, type StatusGuardConfig } from "@/hooks/use-status-guard";
import type { UseFormFlowResult } from "@/hooks/use-form-flow";
import { spacing } from "@/constants/design-system";

export interface FormScreenProps<TForm extends Record<string, any>, TResult> {
  title: string;
  subtitle?: string;
  mode: "create" | "edit";
  form: UseFormReturn<TForm>;
  flow: UseFormFlowResult<TForm, TResult>;
  privilege?: PrivilegeReq;
  /** Edit-mode terminal-status block. */
  editGuard?: StatusGuardConfig<any>;
  /** Edit-mode hydration query. Template waits on this for screen-ready. */
  loadQuery?: UseQueryResult<any>;
  /** Whether to confirm cancel when the form is dirty. Default: true. */
  cancelConfirm?: boolean;
  submitLabel?: string;
  /** Label shown on the submit button while the mutation is pending. */
  submittingLabel: string;
  /** Hide the in-page PageHeader. Use when the route already provides chrome. */
  hideHeader?: boolean;
  children: ReactNode;
}

function InnerFormScreen<TForm extends Record<string, any>, TResult>(
  props: FormScreenProps<TForm, TResult>,
) {
  const { colors } = useTheme();
  const isReady = !props.loadQuery?.isLoading;
  useScreenReady(isReady);

  // Provide KeyboardAwareFormContext so FormCard / FormFieldGroup children
  // get keyboard-aware focus tracking out of the box. Consumers that need
  // their own provider can still nest one — the inner provider wins.
  const { handlers } = useKeyboardAwareScroll();
  const keyboardContextValue = useMemo<KeyboardAwareFormContextType>(
    () => ({
      onFieldLayout: handlers.handleFieldLayout,
      onFieldFocus: handlers.handleFieldFocus,
      onComboboxOpen: handlers.handleComboboxOpen,
      onComboboxClose: handlers.handleComboboxClose,
    }),
    [
      handlers.handleFieldLayout,
      handlers.handleFieldFocus,
      handlers.handleComboboxOpen,
      handlers.handleComboboxClose,
    ],
  );

  // Edit-mode terminal-status block — show read-only banner, hide form body.
  const editingEntity =
    props.mode === "edit" && props.editGuard
      ? (props.loadQuery?.data?.data ?? props.loadQuery?.data ?? null)
      : null;
  const guard = useStatusGuard(editingEntity, {
    field: props.editGuard?.field,
    editable: props.editGuard?.editable ?? [],
    redirectOnBlock: props.editGuard?.redirectOnBlock,
    message: props.editGuard?.message,
  });
  const blocked = props.mode === "edit" && guard.isTerminal;

  if (props.loadQuery?.isLoading) {
    return (
      <ThemedView style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </ThemedView>
    );
  }

  if (props.loadQuery?.isError) {
    return (
      <ErrorScreen
        error={props.loadQuery.error as any}
        onRetry={() => props.loadQuery!.refetch()}
      />
    );
  }

  if (blocked) {
    return (
      <ThemedView style={styles.root}>
        {!props.hideHeader && (
          <PageHeader title={props.title} subtitle={props.subtitle} variant="list" />
        )}
        <View style={[styles.banner, { backgroundColor: colors.muted }]}>
          <ThemedText style={styles.bannerText}>
            {guard.message ??
              "Este registro está em um estado finalizado e não pode ser editado."}
          </ThemedText>
        </View>
      </ThemedView>
    );
  }

  const cancelConfirm = props.cancelConfirm ?? true;
  const onCancel = cancelConfirm
    ? () => void props.flow.cancel()
    : () => {
        // Skip dirty-form confirmation. Rare — used by filter forms.
        const f: any = props.flow;
        const nav = f?._nav;
        if (nav?.goBack) nav.goBack();
      };

  return (
    <ThemedView style={styles.root}>
      {!props.hideHeader && (
        <PageHeader title={props.title} subtitle={props.subtitle} variant="list" />
      )}
      <FormProvider {...props.form}>
        <KeyboardAwareFormProvider value={keyboardContextValue}>
          <TouchableWithoutFeedback
            onPress={Keyboard.dismiss}
            accessible={false}
          >
            <View style={styles.body}>{props.children}</View>
          </TouchableWithoutFeedback>
          <FormActionBar
            onCancel={onCancel}
            onSubmit={() => props.flow.submit()}
            isSubmitting={props.flow.isSubmitting}
            canSubmit={!props.flow.isBlocked}
            submitLabel={props.submitLabel ?? (props.mode === "create" ? "Cadastrar" : "Salvar")}
            submittingLabel={props.submittingLabel}
            form={props.form}
          />
        </KeyboardAwareFormProvider>
      </FormProvider>
    </ThemedView>
  );
}

export function FormScreen<TForm extends Record<string, any>, TResult>(
  props: FormScreenProps<TForm, TResult>,
) {
  if (props.privilege) {
    return (
      <PrivilegeGate required={props.privilege} fallback="unauthorized">
        <InnerFormScreen {...props} />
      </PrivilegeGate>
    );
  }
  return <InnerFormScreen {...props} />;
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  body: {
    flex: 1,
    padding: spacing.md,
  },
  banner: {
    margin: spacing.md,
    padding: spacing.md,
    borderRadius: 8,
  },
  bannerText: {
    fontSize: 14,
  },
});
