import { useState } from "react";
import { View, KeyboardAvoidingView, Platform, TouchableWithoutFeedback, Keyboard, Pressable } from "react-native";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { contactMethodSchema } from '../../schemas';
import { useAuth } from "@/contexts/auth-context";
import { useScreenReady } from "@/hooks/use-screen-ready";
import { useFormFlow } from "@/hooks/use-form-flow";
import { useNav } from "@/contexts/nav";
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
import { IconEye, IconEyeOff } from "@tabler/icons-react-native";
import { Logo } from "@/components/ui/logo";
import { shadow, spacing } from "@/constants/design-system";
import { useTheme } from "@/lib/theme";

// Create a schema that matches the form structure
const registerFormSchema = z
  .object({
    name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres").max(200, "Nome deve ter no máximo 200 caracteres"),
    contact: contactMethodSchema,
    password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "As senhas não coincidem",
    path: ["confirmPassword"],
  });

type RegisterFormData = z.infer<typeof registerFormSchema>;

/**
 * Register screen — bespoke centered-card layout (auth pages don't fit
 * standard <FormScreen>). Mutation/cancel/navigation flow goes through
 * `useFormFlow`; routes typed via `authRoute`.
 */
export default function RegisterScreen() {
  useScreenReady();
  const nav = useNav();
  const { colors } = useTheme();
  const { register: registerUser } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const form = useForm<RegisterFormData>({
    resolver: zodResolver(registerFormSchema),
  });

  const {
    setValue,
    formState: { errors },
    watch,
  } = form;

  const name = watch("name") || "";
  const contact = watch("contact") || "";
  const password = watch("password") || "";
  const confirmPassword = watch("confirmPassword") || "";

  // Result determines post-success navigation:
  //   'verify-phone' → SMS verification screen
  //   'verify-email' → login (the verification email link will resume there)
  //   'auto-login' → AuthContext logged us in automatically; no nav
  type RegisterResult =
    | { kind: "verify-phone"; phone: string }
    | { kind: "verify-email" }
    | { kind: "auto-login" };

  const flow = useFormFlow<RegisterFormData, RegisterResult>({
    form,
    mutation: async (data): Promise<RegisterResult> => {
      const result = await registerUser({
        name: data.name,
        contact: data.contact,
        password: data.password,
      });

      if (result.requiresVerification) {
        if (result.phone) {
          console.log("Conta criada com sucesso! Você receberá um código de verificação por SMS.");
          return { kind: "verify-phone", phone: result.phone };
        }
        console.log("Conta criada com sucesso! Verifique seu email para continuar.");
        return { kind: "verify-email" };
      }

      console.log("Conta criada com sucesso! Você será redirecionado para o sistema.");
      return { kind: "auto-login" };
    },
    onSuccess: (result) => {
      if (result.kind === "verify-phone") {
        nav.replace(
          authRoute(routes.authentication.verifyCode, {
            contact: result.phone,
            returnTo: "/(autenticacao)/entrar",
          }),
        );
      } else if (result.kind === "verify-email") {
        nav.replace(authRoute(routes.authentication.login));
      }
      // auto-login → no nav (AuthContext handles it)
    },
    onError: (error) => {
      const errorMessage = error instanceof Error ? error.message : "Ocorreu um erro ao criar sua conta";
      // Special case: API may surface success-as-error during email verification flow.
      if (errorMessage.includes("Conta criada com sucesso")) {
        console.log("Conta criada com sucesso! Verifique seu email ou telefone para continuar.");
      } else {
        console.error("Erro ao criar conta:", errorMessage);
      }
    },
  });

  const isLoading = flow.isSubmitting;

  return (
    <ThemedView style={{ flex: 1 }}>
      <ThemedSafeAreaView style={{ flex: 1 }}>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
            <ThemedScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: spacing.md, paddingVertical: spacing.lg }}>
              <View style={{ maxWidth: 400, width: "100%", position: "relative" }}>
                <View style={{ position: "absolute", right: 8, top: 8, zIndex: 1000 }}>
                  <ThemeToggle size={24} />
                </View>
                <Card style={{ borderColor: "transparent", ...shadow.lg, width: "100%" }}>
                  <CardHeader style={{ alignItems: "center", paddingBottom: spacing.xl }}>
                  {/* Logo */}
                  <View style={{ marginBottom: spacing.md }}>
                    <Logo size="lg" />
                  </View>

                  <ThemedText size="2xl" weight="semibold" style={{ textAlign: "center" }}>
                    Criar conta
                  </ThemedText>
                  <ThemedText variant="muted" size="sm" style={{ textAlign: "center" }}>
                    Preencha os dados abaixo para criar sua conta
                  </ThemedText>
                </CardHeader>

                <CardContent style={{ gap: spacing.md }}>
                  {/* Name Field */}
                  <View style={{ gap: spacing.sm }}>
                    <ThemedText size="sm" weight="medium">
                      Nome completo
                    </ThemedText>
                    <ThemedTextInput
                      placeholder="Seu nome completo"
                      autoCapitalize="words"
                      autoComplete="name"
                      value={name}
                      onChangeText={(text) => setValue("name", text)}
                      editable={!isLoading}
                      error={errors.name?.message ? String(errors.name.message) : undefined}
                      accessible
                      accessibilityLabel="Campo de nome completo"
                      accessibilityHint="Digite seu nome completo"
                    />
                  </View>

                  {/* Email/Phone Field */}
                  <View style={{ gap: spacing.sm }}>
                    <ThemedText size="sm" weight="medium">
                      Email ou Telefone
                    </ThemedText>
                    <ThemedTextInput
                      placeholder="seu@email.com ou (11) 98765-4321"
                      autoCapitalize="none"
                      keyboardType="email-address"
                      autoComplete="username"
                      value={contact}
                      onChangeText={(text) => setValue("contact", text)}
                      editable={!isLoading}
                      error={errors.contact?.message ? String(errors.contact.message) : undefined}
                      accessible
                      accessibilityLabel="Campo de email ou telefone"
                      accessibilityHint="Digite seu email ou número de telefone"
                    />
                  </View>

                  {/* Password Field */}
                  <View style={{ gap: spacing.sm }}>
                    <ThemedText size="sm" weight="medium">
                      Senha
                    </ThemedText>
                    <ThemedTextInput
                      placeholder="••••••••"
                      autoCapitalize="none"
                      autoComplete="new-password"
                      secureTextEntry={!showPassword}
                      value={password}
                      onChangeText={(text) => setValue("password", text)}
                      editable={!isLoading}
                      error={errors.password?.message ? String(errors.password.message) : undefined}
                      containerStyle={{ marginBottom: 0 }}
                      accessible
                      accessibilityLabel="Campo de senha"
                      accessibilityHint="Digite sua senha"
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
                      error={errors.confirmPassword?.message ? String(errors.confirmPassword.message) : undefined}
                      containerStyle={{ marginBottom: 0 }}
                      accessible
                      accessibilityLabel="Campo de confirmação de senha"
                      accessibilityHint="Digite a senha novamente para confirmar"
                      rightIcon={
                        <Pressable
                          onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                          disabled={isLoading}
                          accessible
                          accessibilityLabel={showConfirmPassword ? "Ocultar senha" : "Mostrar senha"}
                          accessibilityRole="button"
                        >
                          {showConfirmPassword ? <IconEyeOff size={20} color={colors.mutedForeground} /> : <IconEye size={20} color={colors.mutedForeground} />}
                        </Pressable>
                      }
                    />
                  </View>
                </CardContent>

                <CardFooter style={{ paddingTop: spacing.lg, gap: spacing.md }}>
                  {/* Submit Button */}
                  <Button onPress={() => void flow.submit()} disabled={isLoading} variant="default" size="lg" style={{ width: "100%" }}>
                    {isLoading && <LoadingSpinner size="sm" style={{ marginRight: spacing.sm }} />}
                    <ThemedText size="base" weight="semibold" style={{ color: "white" }}>
                      {isLoading ? "Criando conta..." : "Criar conta"}
                    </ThemedText>
                  </Button>

                  {/* Login Link */}
                  <View style={{ alignItems: "center" }}>
                    <ThemedText variant="muted" size="sm" style={{ textAlign: "center" }}>
                      Já tem uma conta?{" "}
                      <ThemedText
                        variant="primary"
                        size="sm"
                        weight="semibold"
                        onPress={() => nav.push(authRoute(routes.authentication.login))}
                        style={{ textDecorationLine: "underline" }}
                      >
                        Fazer login
                      </ThemedText>
                    </ThemedText>
                  </View>
                </CardFooter>
              </Card>
              </View>
            </ThemedScrollView>
          </KeyboardAvoidingView>
        </TouchableWithoutFeedback>
      </ThemedSafeAreaView>
    </ThemedView>
  );
}
