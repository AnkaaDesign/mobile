import { useState, useEffect } from "react";
import { View, KeyboardAvoidingView, Platform } from "react-native";
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
import { maskPhone } from "@/utils";

export default function VerifyPasswordCodeScreen() {
  const router = useRouter();
  const { contact, returnTo } = useLocalSearchParams<{
    contact: string;
    returnTo: string;
  }>();

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

    // Validate code format (6 digits)
    const trimmedCode = code.trim();
    if (!/^\d{6}$/.test(trimmedCode)) {
      setError("O código deve conter 6 dígitos numéricos.");
      return;
    }

    // Navigate directly to password reset page - the code will be validated
    // when the user submits the new password via /auth/password-reset endpoint
    console.log("Código informado. Redirecionando para definir nova senha.");
    router.replace({
      pathname: `/(autenticacao)/redefinir-senha/${trimmedCode}` as any,
      params: {
        contact: contactValue,
        code: trimmedCode,
        returnTo: returnTo || '/(autenticacao)/entrar',
      },
    });
  };

  const handleResendCode = async () => {
    if (!contactValue) {
      console.error("Erro: Informação de contato não encontrada");
      return;
    }

    setIsResending(true);
    setError("");

    try {
      // Use password reset request endpoint to resend code (not account verification)
      await authService.requestPasswordReset({ contact: contactValue });

      const contactType = contactValue.includes("@") ? "email" : "SMS";
      console.log(`Código reenviado! Um novo código foi enviado por ${contactType}.`);
    } catch (error) {
      console.error("Resend failed:", error);
      if (error instanceof Error) {
        setError(error.message);
      }
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
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
          <ThemedScrollView
            contentContainerStyle={{ flexGrow: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: spacing.md, paddingVertical: spacing.lg }}
            keyboardShouldPersistTaps="handled"
          >
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
                    isLoading={false}
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
      </ThemedSafeAreaView>
    </ThemedView>
  );
}
