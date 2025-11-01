import { useState, useEffect } from "react";
import { View, KeyboardAvoidingView, Platform, TouchableWithoutFeedback, Keyboard, Alert } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useTheme } from "@/lib/theme";

import { ThemedView } from "@/components/ui/themed-view";
import { ThemedScrollView } from "@/components/ui/themed-scroll-view";
import { ThemedText } from "@/components/ui/themed-text";
import { ThemedSafeAreaView } from "@/components/ui/themed-safe-area-view";
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Logo } from "@/components/ui/logo";
import { VerificationCodeForm } from "@/components/auth/verification-code-form";
import { shadow, spacing } from "@/constants/design-system";
import { useAuth } from "@/contexts/auth-context";
import { maskPhone } from '../../utils';

export default function VerificationCodeScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { verifyCode, resendVerification } = useAuth();
  const [error, setError] = useState("");

  const { contact, returnTo, contactInfo, phoneNumber, email } = useLocalSearchParams();

  // Support both new format (contact) and legacy format (contactInfo)
  const contactValue = contact || contactInfo || phoneNumber || email;

  // Clean up contact value
  const cleanContactValue = Array.isArray(contactValue) ? contactValue[0] : contactValue;

  useEffect(() => {
    // Redirect if no contact value provided
    if (!cleanContactValue) {
      router.replace('/(autenticacao)/entrar' as any);
    }
  }, [cleanContactValue, router]);

  const handleVerification = async (code: string) => {
    if (!cleanContactValue) {
      setError("Informação de contato não encontrada");
      return;
    }

    setError("");

    try {
      // Use unified verification endpoint for both email and phone
      await verifyCode.mutateAsync({
        contact: cleanContactValue,
        code: code,
      });

      Alert.alert("Verificação bem-sucedida!", "Sua conta foi verificada com sucesso.", [
        {
          text: "OK",
          onPress: () => {
            const destination = Array.isArray(returnTo) ? returnTo[0] : returnTo;
            router.replace((destination || '/(autenticacao)/entrar') as any);
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
    }
  };

  const handleResendCode = async () => {
    if (!cleanContactValue) {
      Alert.alert("Erro", "Informação de contato não encontrada");
      return;
    }

    setError("");

    try {
      // Use unified resend verification endpoint
      await resendVerification.mutateAsync({ contact: cleanContactValue });

      const contactType = cleanContactValue.includes("@") ? "email" : "SMS";
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
    }
  };

  const handleGoBack = () => {
    router.back();
  };

  if (!cleanContactValue) {
    return null;
  }

  const isEmail = cleanContactValue.includes("@");
  const displayContact = isEmail ? cleanContactValue : maskPhone(cleanContactValue);
  const contactType = isEmail ? "email" : "telefone";

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
                    Verificar conta
                  </ThemedText>
                  <ThemedText variant="muted" size="sm" style={{ textAlign: "center" }}>
                    Digite o código de 6 dígitos enviado para seu {contactType}: {"\n"}
                    <ThemedText size="base" weight="semibold">
                      {displayContact}
                    </ThemedText>
                  </ThemedText>
                </CardHeader>

                <CardContent>
                  <VerificationCodeForm
                    contact={cleanContactValue}
                    onSubmit={handleVerification}
                    onResendCode={handleResendCode}
                    isLoading={verifyCode.isPending}
                    isResending={resendVerification.isPending}
                    error={error}
                    contactInfo={displayContact}
                    verificationType={isEmail ? "email" : "phone"}
                  />
                </CardContent>

                <CardFooter style={{ paddingTop: spacing.lg }}>
                  {/* Back Button */}
                  <View style={{ alignItems: "center" }}>
                    <ThemedText variant="primary" size="sm" weight="semibold" onPress={handleGoBack} style={{ textDecorationLine: "underline" }}>
                      Voltar para o login
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
