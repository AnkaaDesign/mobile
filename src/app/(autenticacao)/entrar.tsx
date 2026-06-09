import { useState } from "react";
import { View, KeyboardAvoidingView, Platform, TouchableWithoutFeedback, Keyboard, Pressable } from "react-native";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useScreenReady } from "@/hooks/use-screen-ready";
import { useFormFlow } from "@/hooks/use-form-flow";
import { signInSchema, SignInFormData } from '../../schemas';
import { useAuth } from "@/contexts/auth-context";
import { useNavigationHistory } from "@/contexts/navigation-history-context";
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
import { Icon } from "@/components/ui/icon";
import { Logo } from "@/components/ui/logo";
import { shadow, spacing } from "@/constants/design-system";

/**
 * Login screen — uses bespoke centered-card layout (auth pages don't fit the
 * standard <FormScreen> template which assumes PageHeader + FormActionBar).
 *
 * Form mutation/cancel/navigation flow goes through `useFormFlow` (callback
 * form), and routes are typed via `mobileRoute`.
 */
export default function LoginScreen() {
  useScreenReady();
  const nav = useNav();
  const { login } = useAuth();
  const { clearHistory } = useNavigationHistory();
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<SignInFormData>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      contact: "",
      password: "",
    },
  });

  const {
    setValue,
    formState: { errors },
    watch,
  } = form;

  const contact = watch("contact") || "";
  const password = watch("password") || "";

  // Result is `'home'` for a clean login (navigate to home), `'verify'` when
  // the account needs verification (we navigated there manually), or `'noop'`
  // when AuthContext already redirected (e.g. VERIFICATION_REDIRECT).
  type LoginResult = "home" | "verify" | "noop";
  const flow = useFormFlow<SignInFormData, LoginResult>({
    form,
    mutation: async (data): Promise<LoginResult> => {
      try {
        await login(data.contact, data.password);
        clearHistory();
        return "home";
      } catch (error: any) {
        const errorMessage = error?.message || error?.toString() || "Ocorreu um erro ao fazer login";

        // Handled by AuthContext (it already redirected) — swallow.
        if (errorMessage === "VERIFICATION_REDIRECT") {
          console.log("[Login] Account needs verification - redirected by AuthContext");
          return "noop";
        }

        // Account not verified — bounce to verification screen.
        if (
          errorMessage.includes("Conta não verificada") ||
          errorMessage.includes("Conta ainda não verificada") ||
          errorMessage.includes("verificação")
        ) {
          console.log("[Login] Account not verified - redirecting to verification");
          nav.push(
            authRoute(routes.authentication.verifyCode, {
              contact: data.contact,
              returnTo: "/(autenticacao)/entrar",
            }),
          );
          return "verify";
        }

        // Re-throw so useFormFlow surfaces the error to onError below.
        throw error;
      }
    },
    onSuccess: (result) => {
      // Only the clean-login path navigates here; the others either redirected
      // manually (verify) or AuthContext already redirected (noop).
      if (result === "home") {
        nav.replace(mobileRoute(routes.home));
      }
    },
    onError: (err) => {
      const errorMessage = err instanceof Error ? err.message : String(err);
      console.error("[Login] Login error:", errorMessage);
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
                    Bem-vindo de volta
                  </ThemedText>
                  <ThemedText variant="muted" size="sm" style={{ textAlign: "center" }}>
                    Entre com suas credenciais para acessar sua conta
                  </ThemedText>
                </CardHeader>

                <CardContent style={{ gap: spacing.md }}>
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
                      onChangeText={(text) => setValue("contact", text, { shouldValidate: true })}
                      editable={!isLoading}
                      error={errors.contact?.message}
                      accessible
                      accessibilityLabel="Campo de email ou telefone"
                      accessibilityHint="Digite seu email ou número de telefone para entrar"
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
                      autoComplete="current-password"
                      secureTextEntry={!showPassword}
                      value={password}
                      onChangeText={(text) => setValue("password", text, { shouldValidate: true })}
                      editable={!isLoading}
                      error={errors.password?.message}
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
                          {showPassword ? <Icon name="eye-off" size="button" variant="muted" /> : <Icon name="eye" size="button" variant="muted" />}
                        </Pressable>
                      }
                    />

                    {/* Forgot Password Link - closer to password field */}
                    <View style={{ alignItems: "flex-end", marginTop: spacing.sm }}>
                      <ThemedText
                        variant="primary"
                        size="sm"
                        onPress={() => nav.push(authRoute(routes.authentication.recoverPassword))}
                        style={{ textDecorationLine: "underline" }}
                      >
                        Esqueceu sua senha?
                      </ThemedText>
                    </View>
                  </View>
                </CardContent>

                <CardFooter style={{ paddingTop: spacing.lg, gap: spacing.md }}>
                  {/* Submit Button */}
                  <Button onPress={() => void flow.submit()} disabled={isLoading} variant="default" size="lg" style={{ width: "100%" }}>
                    {isLoading && <LoadingSpinner size="sm" style={{ marginRight: spacing.sm }} />}
                    <ThemedText size="base" weight="semibold" style={{ color: "white" }}>
                      {isLoading ? "Fazendo login..." : "Entrar"}
                    </ThemedText>
                  </Button>
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
