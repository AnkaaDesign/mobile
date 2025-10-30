import React, { useState } from "react";
import { View, KeyboardAvoidingView, Platform, TouchableWithoutFeedback, Keyboard, Alert } from "react-native";
import { useRouter } from "expo-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { passwordRecoverySchema, type PasswordRecoveryFormData } from '../../schemas';
import { useAuth } from "@/contexts/auth-context";
import { useTheme } from "@/lib/theme";
import { routes } from '../../constants';
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
import { Logo } from "@/components/ui/logo";
import { shadow, spacing } from "@/constants/design-system";

export default function RecoverPasswordScreen() {
  const router = useRouter();
  const { recoverPassword } = useAuth();
  const { isDark, colors } = useTheme();
  const [isLoading, setIsLoading] = useState(false);

  const {
    setValue,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<PasswordRecoveryFormData>({
    resolver: zodResolver(passwordRecoverySchema),
  });

  const contact = watch("contact") || "";

  const onSubmit = async (data: PasswordRecoveryFormData) => {
    setIsLoading(true);

    try {
      await recoverPassword(data);

      Alert.alert("Código enviado!", "Você receberá um código de 6 dígitos para redefinir sua senha.", [{ text: "OK" }]);

      // Redirect to verification page for password reset
      router.replace({
        pathname: '/(autenticacao)/verificar-redefinicao-senha' as any,
        params: {
          contact: data.contact,
          returnTo: '/(autenticacao)/entrar',
        },
      });
    } catch (error) {
      Alert.alert("Erro ao enviar código", error instanceof Error ? error.message : "Ocorreu um erro ao enviar o código de recuperação", [{ text: "OK" }]);
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
              <Card style={{ position: "relative", backgroundColor: colors.card, borderColor: "transparent", ...shadow.lg, maxWidth: 400, width: "100%" }}>
                <ThemedView style={{ backgroundColor: "transparent", position: "absolute", right: 8, top: 8 }}>
                  <ThemeToggle size={24} />
                </ThemedView>

                <CardHeader style={{ alignItems: "center", paddingBottom: spacing.xl }}>
                  {/* Logo */}
                  <View style={{ marginBottom: spacing.md }}>
                    <Logo size="lg" />
                  </View>

                  <ThemedText size="2xl" weight="semibold" style={{ textAlign: "center" }}>
                    Recuperar senha
                  </ThemedText>
                  <ThemedText variant="muted" size="sm" style={{ textAlign: "center" }}>
                    Digite seu email ou telefone e enviaremos um código para redefinir sua senha
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
                      onChangeText={(text) => setValue("contact", text)}
                      editable={!isLoading}
                      error={errors.contact?.message}
                      accessible
                      accessibilityLabel="Campo de email ou telefone"
                      accessibilityHint="Digite seu email ou número de telefone para recuperar sua senha"
                    />
                  </View>
                </CardContent>

                <CardFooter style={{ paddingTop: spacing.lg, gap: spacing.md }}>
                  {/* Submit Button */}
                  <Button onPress={handleSubmit(onSubmit)} disabled={isLoading} variant="default" size="lg" style={{ width: "100%" }}>
                    {isLoading && <LoadingSpinner size="sm" style={{ marginRight: spacing.sm }} />}
                    <ThemedText size="base" weight="semibold" style={{ color: "white" }}>
                      {isLoading ? "Enviando..." : "Enviar código de recuperação"}
                    </ThemedText>
                  </Button>

                  {/* Back to Login Link */}
                  <View style={{ alignItems: "center" }}>
                    <ThemedText variant="muted" size="sm" style={{ textAlign: "center" }}>
                      Lembrou sua senha?{" "}
                      <ThemedText
                        variant="primary"
                        size="sm"
                        weight="semibold"
                        onPress={() => router.push('/(autenticacao)/entrar' as any)}
                        style={{ textDecorationLine: "underline" }}
                      >
                        Voltar ao login
                      </ThemedText>
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
