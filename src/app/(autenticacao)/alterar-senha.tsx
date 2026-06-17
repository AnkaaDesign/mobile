import { useState } from "react";
import { View, KeyboardAvoidingView, Platform, TouchableWithoutFeedback, Keyboard, Pressable } from "react-native";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { changePasswordSchema, ChangePasswordFormData } from '../../schemas';
import { authService } from '../../api-client';
import { useScreenReady } from "@/hooks/use-screen-ready";
import { useFormFlow } from "@/hooks/use-form-flow";
import { useAuth } from "@/contexts/auth-context";
import { useNav } from "@/contexts/nav";
import { mobileRoute } from "@/constants/routes.types";
import { routes } from "@/constants/routes";
import { authRoute } from "@/components/auth/auth-routes";

import { ThemedView } from "@/components/ui/themed-view";
import { ThemedScrollView } from "@/components/ui/themed-scroll-view";
import { ThemedText } from "@/components/ui/themed-text";
import { ThemedTextInput } from "@/components/ui/themed-text-input";
import { ThemedSafeAreaView } from "@/components/ui/themed-safe-area-view";
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/loading";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { IconEye, IconEyeOff, IconLock } from "@tabler/icons-react-native";
import { Logo } from "@/components/ui/logo";
import { shadow, spacing, borderRadius } from "@/constants/design-system";
import { useTheme } from "@/lib/theme";

/**
 * Forced change-password screen — shown when the authenticated user has
 * `requirePasswordChange = true`. The API auth guard rejects every protected
 * request with "Você precisa alterar sua senha antes de continuar." until the
 * password is changed, so we route here at login (and as a root-gate backstop)
 * instead of letting the user into the app and 403-ing on every page.
 *
 * The user is already authenticated (valid token), so `/auth/change-password`
 * — which is whitelisted in the guard — works with the current password.
 */
export default function ForcedChangePasswordScreen() {
  useScreenReady();
  const nav = useNav();
  const { colors } = useTheme();
  const { logout, silentRefreshUserData } = useAuth();
  const [showCurrent, setShowCurrent] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const form = useForm<ChangePasswordFormData>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmNewPassword: "",
    },
  });

  const {
    setValue,
    formState: { errors },
    watch,
  } = form;

  const currentPassword = watch("currentPassword") || "";
  const newPassword = watch("newPassword") || "";
  const confirmNewPassword = watch("confirmNewPassword") || "";

  const flow = useFormFlow<ChangePasswordFormData, void>({
    form,
    mutation: async (data) => {
      await authService.changePassword(data);
      // Refresh the cached user so `requirePasswordChange` flips to false before
      // we land back in the app (otherwise the root gate would bounce us here).
      await silentRefreshUserData();
    },
    onSuccess: () => {
      nav.replace(mobileRoute(routes.home));
    },
    onError: (error) => {
      const errorMessage = error instanceof Error ? error.message : "Ocorreu um erro ao alterar sua senha";
      console.error("[ChangePassword] Error:", errorMessage);
    },
  });

  const isLoading = flow.isSubmitting;

  const handleLogout = () => {
    void logout();
    nav.replace(authRoute(routes.authentication.login));
  };

  return (
    <ThemedView style={{ flex: 1 }}>
      <ThemedSafeAreaView style={{ flex: 1 }}>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
            <ThemedScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: spacing.md, paddingVertical: spacing.lg }}>
              <Card style={{ borderColor: "transparent", ...shadow.lg, maxWidth: 400, width: "100%" }}>
                <ThemedView style={{ backgroundColor: "transparent", position: "absolute", right: 8, top: 8 }}>
                  <ThemeToggle size={24} />
                </ThemedView>
                <CardHeader style={{ alignItems: "center", paddingBottom: spacing.xl }}>
                  <View style={{ marginBottom: spacing.md }}>
                    <Logo size="lg" />
                  </View>

                  <ThemedText size="2xl" weight="semibold" style={{ textAlign: "center" }}>
                    Alterar senha
                  </ThemedText>
                  <ThemedText variant="muted" size="sm" style={{ textAlign: "center" }}>
                    Você precisa alterar sua senha antes de continuar.
                  </ThemedText>
                </CardHeader>

                <CardContent style={{ gap: spacing.md }}>
                  {/* Current Password Field */}
                  <View style={{ gap: spacing.sm }}>
                    <ThemedText size="sm" weight="medium">
                      Senha atual
                    </ThemedText>
                    <ThemedTextInput
                      placeholder="••••••••"
                      autoCapitalize="none"
                      autoComplete="current-password"
                      secureTextEntry={!showCurrent}
                      value={currentPassword}
                      onChangeText={(text) => setValue("currentPassword", text)}
                      editable={!isLoading}
                      error={errors.currentPassword?.message}
                      accessible
                      accessibilityLabel="Campo de senha atual"
                      accessibilityHint="Digite sua senha atual"
                      leftIcon={<IconLock size={20} color={colors.mutedForeground} />}
                      rightIcon={
                        <Pressable
                          onPress={() => setShowCurrent(!showCurrent)}
                          disabled={isLoading}
                          accessible
                          accessibilityLabel={showCurrent ? "Ocultar senha" : "Mostrar senha"}
                          accessibilityRole="button"
                        >
                          {showCurrent ? <IconEyeOff size={20} color={colors.mutedForeground} /> : <IconEye size={20} color={colors.mutedForeground} />}
                        </Pressable>
                      }
                    />
                  </View>

                  {/* New Password Field */}
                  <View style={{ gap: spacing.sm }}>
                    <ThemedText size="sm" weight="medium">
                      Nova senha
                    </ThemedText>
                    <ThemedTextInput
                      placeholder="••••••••"
                      autoCapitalize="none"
                      autoComplete="new-password"
                      secureTextEntry={!showPassword}
                      value={newPassword}
                      onChangeText={(text) => setValue("newPassword", text)}
                      editable={!isLoading}
                      error={errors.newPassword?.message}
                      accessible
                      accessibilityLabel="Campo de nova senha"
                      accessibilityHint="Digite sua nova senha"
                      leftIcon={<IconLock size={20} color={colors.mutedForeground} />}
                      rightIcon={
                        <Pressable
                          onPress={() => setShowPassword(!showPassword)}
                          disabled={isLoading}
                          accessible
                          accessibilityLabel={showPassword ? "Ocultar senha" : "Mostrar senha"}
                          accessibilityRole="button"
                        >
                          {showPassword ? <IconEyeOff size={20} color={colors.mutedForeground} /> : <IconEye size={20} color={colors.mutedForeground} />}
                        </Pressable>
                      }
                    />
                  </View>

                  {/* Confirm Password Field */}
                  <View style={{ gap: spacing.sm }}>
                    <ThemedText size="sm" weight="medium">
                      Confirmar nova senha
                    </ThemedText>
                    <ThemedTextInput
                      placeholder="••••••••"
                      autoCapitalize="none"
                      autoComplete="new-password"
                      secureTextEntry={!showConfirm}
                      value={confirmNewPassword}
                      onChangeText={(text) => setValue("confirmNewPassword", text)}
                      editable={!isLoading}
                      error={errors.confirmNewPassword?.message}
                      accessible
                      accessibilityLabel="Campo de confirmar nova senha"
                      accessibilityHint="Digite novamente sua nova senha"
                      leftIcon={<IconLock size={20} color={colors.mutedForeground} />}
                      rightIcon={
                        <Pressable
                          onPress={() => setShowConfirm(!showConfirm)}
                          disabled={isLoading}
                          accessible
                          accessibilityLabel={showConfirm ? "Ocultar confirmação de senha" : "Mostrar confirmação de senha"}
                          accessibilityRole="button"
                        >
                          {showConfirm ? <IconEyeOff size={20} color={colors.mutedForeground} /> : <IconEye size={20} color={colors.mutedForeground} />}
                        </Pressable>
                      }
                    />
                  </View>

                  {/* Password Requirements */}
                  <View style={{ backgroundColor: colors.muted, padding: spacing.md, borderRadius: borderRadius.DEFAULT }}>
                    <ThemedText size="xs" variant="muted" style={{ marginBottom: spacing.xs }}>
                      A senha deve conter:
                    </ThemedText>
                    <ThemedText size="xs" variant="muted">
                      • Pelo menos 8 caracteres
                    </ThemedText>
                    <ThemedText size="xs" variant="muted">
                      • Uma letra maiúscula e uma minúscula
                    </ThemedText>
                    <ThemedText size="xs" variant="muted">
                      • Pelo menos um número
                    </ThemedText>
                  </View>
                </CardContent>

                <CardFooter style={{ paddingTop: spacing.lg, gap: spacing.md }}>
                  <Button onPress={() => void flow.submit()} disabled={isLoading} variant="default" size="lg" style={{ width: "100%" }}>
                    {isLoading && <LoadingSpinner size="sm" style={{ marginRight: spacing.sm }} />}
                    <ThemedText size="base" weight="semibold" style={{ color: "white" }}>
                      {isLoading ? "Alterando senha..." : "Alterar senha"}
                    </ThemedText>
                  </Button>

                  {/* Logout Link */}
                  <View style={{ alignItems: "center" }}>
                    <ThemedText
                      variant="primary"
                      size="sm"
                      weight="semibold"
                      onPress={handleLogout}
                      style={{ textDecorationLine: "underline" }}
                    >
                      Sair
                    </ThemedText>
                  </View>
                </CardFooter>
              </Card>
            </ThemedScrollView>
          </KeyboardAvoidingView>
        </TouchableWithoutFeedback>
      </ThemedSafeAreaView>
    </ThemedView>
  );
}
