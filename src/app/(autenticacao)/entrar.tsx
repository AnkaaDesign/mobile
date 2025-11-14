import { useState } from "react";
import { View, KeyboardAvoidingView, Platform, TouchableWithoutFeedback, Keyboard, Alert, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signInSchema} from '../../schemas';
import { useAuth } from "@/contexts/auth-context";
import { useNavigationHistory } from "@/contexts/navigation-history-context";

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
import { useToast } from "@/hooks/use-toast";

export default function LoginScreen() {
  const router = useRouter();
  const { login } = useAuth();
  const { clearHistory } = useNavigationHistory();
  const { error: showError } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const {
    setValue,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<SignInFormData>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      contact: "",
      password: "",
    },
  });

  const contact = watch("contact") || "";
  const password = watch("password") || "";
  const onSubmit = async (data: SignInFormData) => {
    setIsLoading(true);

    try {
      await login(data.contact, data.password);
      // Clear navigation history so back button doesn't show after login
      clearHistory();
      // After successful login, navigate to home
      router.replace('/(tabs)/inicio' as any);
    } catch (error: any) {
      // Extract detailed error information from the enhanced error object
      const errorTitle = error.title || "Erro ao fazer login";
      const errorMessage = error.message || error.toString() || "Ocorreu um erro ao fazer login";
      const errorDetails = error.errors || [];

      // Check if this is a verification redirect
      if (errorMessage === "VERIFICATION_REDIRECT") {
        Alert.alert("Verificação necessária", "Sua conta precisa ser verificada antes de continuar.", [{ text: "OK" }]);
        // Don't navigate or show error - AuthContext already redirected
        return;
      }

      // Check if this is a verification error message
      if (errorMessage.includes("Conta não verificada") || errorMessage.includes("Conta ainda não verificada") || errorMessage.includes("verificação")) {
        Alert.alert("Verificação necessária", "Sua conta precisa ser verificada antes de continuar.", [
          {
            text: "OK",
            onPress: () => {
              // Redirect to verification page
              router.push({
                pathname: '/(autenticacao)/verificar-codigo' as any,
                params: {
                  contact: data.contact,
                  returnTo: '/(autenticacao)/entrar',
                },
              });
            },
          },
        ]);
      } else {
        // Show detailed error using the enhanced toast
        const detailedMessage = errorDetails.length > 0 ? [errorMessage, ...errorDetails] : errorMessage;

        showError(errorTitle, detailedMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ThemedView style={{ flex: 1 }}>
      <ThemedSafeAreaView style={{ flex: 1 }}>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
            <ThemedScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: "center", paddingHorizontal: spacing.md, paddingVertical: spacing.lg }}>
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
                        onPress={() => router.push('/(autenticacao)/recuperar-senha' as any)}
                        style={{ textDecorationLine: "underline" }}
                      >
                        Esqueceu sua senha?
                      </ThemedText>
                    </View>
                  </View>
                </CardContent>

                <CardFooter style={{ paddingTop: spacing.lg, gap: spacing.md }}>
                  {/* Submit Button */}
                  <Button onPress={handleSubmit(onSubmit)} disabled={isLoading} variant="default" size="lg" style={{ width: "100%" }}>
                    {isLoading && <LoadingSpinner size="sm" style={{ marginRight: spacing.sm }} />}
                    <ThemedText size="base" weight="semibold" style={{ color: "white" }}>
                      {isLoading ? "Fazendo login..." : "Entrar"}
                    </ThemedText>
                  </Button>

                  {/* Register Link */}
                  <View style={{ alignItems: "center" }}>
                    <ThemedText variant="muted" size="sm" style={{ textAlign: "center" }}>
                      Não tem uma conta?{" "}
                      <ThemedText
                        variant="primary"
                        size="sm"
                        weight="semibold"
                        onPress={() => router.push('/(autenticacao)/registrar' as any)}
                        style={{ textDecorationLine: "underline" }}
                      >
                        Cadastre-se
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
