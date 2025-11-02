import { useState, useEffect } from "react";
import { View, KeyboardAvoidingView, Platform, TouchableWithoutFeedback, Keyboard, Alert } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";

import { ThemedView } from "@/components/ui/themed-view";
import { ThemedScrollView } from "@/components/ui/themed-scroll-view";
import { ThemedText } from "@/components/ui/themed-text";
import { ThemedSafeAreaView } from "@/components/ui/themed-safe-area-view";
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Logo } from "@/components/ui/logo";
import { VerificationCodeForm } from "@/components/auth/verification-code-form";
import { shadow, spacing } from "@/constants/design-system";
import { authService } from '../../api-client';
import { maskPhone } from '../../utils';

export default function VerifyPasswordCodeScreen() {
  const router = useRouter();
  const { contact, returnTo } = useLocalSearchParams<{
    contact: string;
    returnTo: string;
  }>();

  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [error, setError] = useState("");

  // Support both new format (contact) and legacy format
  const contactValue = contact;

  // Redirect if no contact value provided
  useEffect(() => {
    if (!contactValue) {
      router.replace('/(autenticacao)/recuperar-senha' as any);
    }
  }, [contactValue, router]);

  const handleVerification = async (code: string) => {
    if (!contactValue) {
      setError("Informação de contato não encontrada");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      await authService.verifyCode({
        contact: contactValue,
        code: code.trim(),
      });

      Alert.alert("Código Verificado!", "Agora você pode criar uma nova senha.", [
        {
          text: "Continuar",
          onPress: () => {
            // Navigate to password reset page with verified code
            router.replace({
              pathname: `/(autenticacao)/redefinir-senha/${code.trim()}` as any,
              params: {
                contact: contactValue,
                code: code.trim(),
                returnTo: returnTo || '/(autenticacao)/entrar',
              },
            });
          },
        },
      ]);
    } catch (error) {
      console.error("Verification failed:", error);

      let errorMessage = "Código inválido. Verifique o código e tente novamente.";

      if (error instanceof Error) {
        if (error.message.includes("Limite de requisições excedido")) {
          errorMessage = "Muitas tentativas. Aguarde um minuto antes de tentar novamente.";
        } else if (error.message.includes("expired") || error.message.includes("expirou")) {
          errorMessage = "O código expirou. Solicite um novo código.";
        } else if (error.message.includes("invalid") || error.message.includes("inválido")) {
          errorMessage = "Código inválido. Verifique o código e tente novamente.";
        } else {
          errorMessage = error.message;
        }
      }

      setError(errorMessage);
      Alert.alert("Erro na verificação", errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (!contactValue) {
      Alert.alert("Erro", "Informação de contato não encontrada");
      return;
    }

    setIsResending(true);
    setError("");

    try {
      await authService.resendVerification({ contact: contactValue });

      const contactType = contactValue.includes("@") ? "email" : "SMS";
      Alert.alert("Código reenviado!", `Um novo código foi enviado por ${contactType}.`, [{ text: "OK" }]);
    } catch (error) {
      console.error("Resend failed:", error);

      let errorMessage = "Falha ao reenviar o código. Tente novamente.";

      if (error instanceof Error) {
        if (error.message.includes("Limite de requisições excedido") || error.message.includes("rate limit")) {
          errorMessage = "Muitas tentativas. Aguarde antes de solicitar um novo código.";
        } else {
          errorMessage = error.message;
        }
      }

      Alert.alert("Erro ao reenviar código", errorMessage);
    } finally {
      setIsResending(false);
    }
  };

  const handleGoBack = () => {
    router.back();
  };

  if (!contactValue) {
    return null;
  }

  const isEmail = contactValue.includes("@");
  const displayContact = isEmail ? contactValue : maskPhone(contactValue);
  const contactType = isEmail ? "email" : "telefone";

  return (
    <ThemedView style={{ flex: 1 }}>
      <ThemedSafeAreaView style={{ flex: 1 }}>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
            <ThemedScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: "center", paddingHorizontal: spacing.md, paddingVertical: spacing.lg }}>
              <Card style={{ borderColor: "transparent", ...shadow.lg, maxWidth: 400, width: "100%" }}>
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
                    Digite o código de recuperação enviado para seu {contactType}: {"\n"}
                    <ThemedText size="base" weight="semibold">
                      {displayContact}
                    </ThemedText>
                  </ThemedText>
                </CardHeader>

                <CardContent>
                  <VerificationCodeForm
                    contact={contactValue}
                    onSubmit={handleVerification}
                    onResendCode={handleResendCode}
                    isLoading={isLoading}
                    isResending={isResending}
                    error={error}
                    contactInfo={displayContact}
                    verificationType={isEmail ? "email" : "phone"}
                  />
                </CardContent>

                <CardFooter style={{ paddingTop: spacing.lg }}>
                  {/* Back Button */}
                  <View style={{ alignItems: "center" }}>
                    <ThemedText variant="primary" size="sm" weight="semibold" onPress={handleGoBack} style={{ textDecorationLine: "underline" }}>
                      Voltar para recuperação de senha
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
