import React, { useState } from "react";
import { View, KeyboardAvoidingView, Platform, TouchableWithoutFeedback, Keyboard, Alert, Pressable } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { passwordResetSchema, type PasswordResetFormData } from '../../../schemas';
import { authService } from '../../../api-client';
import { useTheme } from "@/lib/theme";
import { routes } from '../../../constants';
import { routeToMobilePath } from "@/lib/route-mapper";
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

export default function ResetPasswordScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const { contact, code } = useLocalSearchParams();

  // Ensure contact and code are strings
  const contactValue = Array.isArray(contact) ? contact[0] : contact;
  const codeValue = Array.isArray(code) ? code[0] : code;

  const {
    setValue,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<PasswordResetFormData>({
    resolver: zodResolver(passwordResetSchema),
    defaultValues: {
      contact: contactValue || "",
      code: codeValue || "",
    },
  });

  const password = watch("password") || "";
  const confirmPassword = watch("confirmPassword") || "";

  const onSubmit = async (data: PasswordResetFormData) => {
    setIsLoading(true);

    try {
      await authService.resetPasswordWithCode(data);

      Alert.alert("Senha redefinida com sucesso!", "Sua senha foi alterada. Faça login com sua nova senha.", [
        {
          text: "OK",
          onPress: () => {
            router.replace('/(autenticacao)/entrar' as any);
          },
        },
      ]);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Ocorreu um erro ao redefinir sua senha";

      if (errorMessage.includes("código") || errorMessage.includes("expirou")) {
        Alert.alert("Código inválido", "O código informado é inválido ou expirou. Solicite um novo código.", [
          {
            text: "Solicitar novo código",
            onPress: () => {
              router.replace({
                pathname: '/(autenticacao)/recuperar-senha' as any,
                params: { contact: contactValue },
              });
            },
          },
          { text: "Cancelar", style: "cancel" },
        ]);
      } else {
        Alert.alert("Erro ao redefinir senha", errorMessage, [{ text: "OK" }]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // If no contact or code, redirect to forgot password
  React.useEffect(() => {
    if (!contactValue || !codeValue) {
      router.replace('/(autenticacao)/recuperar-senha' as any);
    }
  }, [contactValue, codeValue, router]);

  if (!contactValue || !codeValue) {
    return null;
  }

  return (
    <ThemedView style={{ flex: 1 }}>
      <ThemedSafeAreaView style={{ flex: 1 }}>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
            <ThemedScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: "center", paddingHorizontal: spacing.md, paddingVertical: spacing.lg }}>
              <Card style={{ backgroundColor: colors.card, borderColor: "transparent", ...shadow.lg, maxWidth: 400, width: "100%" }}>
                <ThemedView style={{ backgroundColor: "transparent", position: "absolute", right: 8, top: 8 }}>
                  <ThemeToggle size={24} />
                </ThemedView>
                <CardHeader style={{ alignItems: "center", paddingBottom: spacing.xl }}>
                  {/* Logo */}
                  <View style={{ marginBottom: spacing.md }}>
                    <Logo size="lg" />
                  </View>

                  <ThemedText size="2xl" weight="semibold" style={{ textAlign: "center" }}>
                    Redefinir senha
                  </ThemedText>
                  <ThemedText variant="muted" size="sm" style={{ textAlign: "center" }}>
                    Crie uma nova senha para sua conta
                  </ThemedText>
                </CardHeader>

                <CardContent style={{ gap: spacing.md }}>
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
                      value={password}
                      onChangeText={(text) => setValue("password", text)}
                      editable={!isLoading}
                      error={errors.password?.message}
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
                      Confirmar senha
                    </ThemedText>
                    <ThemedTextInput
                      placeholder="••••••••"
                      autoCapitalize="none"
                      autoComplete="new-password"
                      secureTextEntry={!showConfirmPassword}
                      value={confirmPassword}
                      onChangeText={(text) => setValue("confirmPassword", text)}
                      editable={!isLoading}
                      error={errors.confirmPassword?.message}
                      accessible
                      accessibilityLabel="Campo de confirmar senha"
                      accessibilityHint="Digite novamente sua nova senha"
                      leftIcon={<IconLock size={20} color={colors.mutedForeground} />}
                      rightIcon={
                        <Pressable
                          onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                          disabled={isLoading}
                          accessible
                          accessibilityLabel={showConfirmPassword ? "Ocultar confirmação de senha" : "Mostrar confirmação de senha"}
                          accessibilityRole="button"
                        >
                          {showConfirmPassword ? <IconEyeOff size={20} color={colors.mutedForeground} /> : <IconEye size={20} color={colors.mutedForeground} />}
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
                  {/* Submit Button */}
                  <Button onPress={handleSubmit(onSubmit)} disabled={isLoading} variant="default" size="lg" style={{ width: "100%" }}>
                    {isLoading && <LoadingSpinner size="sm" style={{ marginRight: spacing.sm }} />}
                    <ThemedText size="base" weight="semibold" style={{ color: "white" }}>
                      {isLoading ? "Redefinindo senha..." : "Redefinir senha"}
                    </ThemedText>
                  </Button>

                  {/* Back to Login Link */}
                  <View style={{ alignItems: "center" }}>
                    <ThemedText
                      variant="primary"
                      size="sm"
                      weight="semibold"
                      onPress={() => router.push('/(autenticacao)/entrar' as any)}
                      style={{ textDecorationLine: "underline" }}
                    >
                      Voltar ao login
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
