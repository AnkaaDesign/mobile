import { useState, useEffect } from "react";
import { View, StyleSheet } from "react-native";
import { InputOTP } from "@/components/ui/input-otp";
import { Button } from "@/components/ui/button";
import { ThemedText } from "@/components/ui/themed-text";
import { LoadingSpinner } from "@/components/ui/loading";
import { spacing } from "@/constants/design-system";
import { useTheme } from "@/lib/theme";

interface VerificationCodeFormProps {
  contact?: string;
  onSubmit: (code: string) => void;
  onResendCode?: () => void;
  isLoading?: boolean;
  isResending?: boolean;
  error?: string;
  codeLength?: number;
  contactInfo?: string;
  verificationType?: "phone" | "email";
  rateLimited?: boolean;
}

export function VerificationCodeForm({
  onSubmit,
  onResendCode,
  isLoading = false,
  isResending = false,
  error,
  codeLength = 6,
  contactInfo,
  verificationType = "phone",
  rateLimited = false,
}: VerificationCodeFormProps) {
  const { colors } = useTheme();
  const [code, setCode] = useState("");
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  // Auto-submit when code is complete
  useEffect(() => {
    if (code.length === codeLength && !rateLimited && !hasSubmitted && !isLoading) {
      // Small delay to ensure state is settled
      const timer = setTimeout(() => {
        setHasSubmitted(true);
        onSubmit(code);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [code, codeLength, rateLimited, hasSubmitted, isLoading, onSubmit]);

  // Reset hasSubmitted when code changes (user editing)
  useEffect(() => {
    if (code.length < codeLength && hasSubmitted) {
      setHasSubmitted(false);
    }
  }, [code, codeLength, hasSubmitted]);

  // Clear code on error
  useEffect(() => {
    if (error && hasSubmitted) {
      setCode("");
      setHasSubmitted(false);
    }
  }, [error, hasSubmitted]);

  // Cooldown timer
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setInterval(() => {
        setResendCooldown((prev) => {
          if (prev <= 1) {
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [resendCooldown]);

  const handleSubmit = () => {
    if (code.length === codeLength && !rateLimited && !hasSubmitted) {
      setHasSubmitted(true);
      onSubmit(code);
    }
  };

  const handleResend = () => {
    if (onResendCode && !isResending && resendCooldown === 0) {
      onResendCode();
      setResendCooldown(60); // 60 second cooldown
      setCode(""); // Clear the code
    }
  };

  return (
    <View style={styles.container}>
      {/* Rate Limit Warning */}
      {rateLimited && (
        <View style={StyleSheet.flatten([styles.alert, { backgroundColor: colors.destructive + "20", borderColor: colors.destructive }])}>
          <ThemedText size="sm" style={{ color: colors.destructive }}>
            ⚠️ Aguarde 1 minuto antes de tentar novamente
          </ThemedText>
        </View>
      )}

      {/* Error Display */}
      {error && !rateLimited && (
        <View style={StyleSheet.flatten([styles.alert, { backgroundColor: colors.destructive + "20", borderColor: colors.destructive }])}>
          <ThemedText size="sm" style={{ color: colors.destructive }}>
            {error}
          </ThemedText>
        </View>
      )}

      {/* Code Input */}
      <View style={styles.inputContainer}>
        <ThemedText size="sm" weight="medium" style={{ textAlign: "center", marginBottom: spacing.md }}>
          Digite o código de {codeLength} dígitos enviado {verificationType === "phone" ? "por SMS" : "por email"}
          {contactInfo && (
            <ThemedText size="sm" weight="semibold">
              {" "}
              para {contactInfo}
            </ThemedText>
          )}
        </ThemedText>

        <InputOTP value={code} onChange={setCode} maxLength={codeLength} disabled={isLoading || rateLimited} error={!!error} autoFocus onComplete={handleSubmit} />
      </View>

      {/* Submit Button */}
      <Button onPress={handleSubmit} disabled={code.length !== codeLength || isLoading || rateLimited} variant="default" size="lg" style={{ width: "100%" }}>
        {isLoading && <LoadingSpinner size="sm" style={{ marginRight: spacing.sm }} />}
        <ThemedText size="base" weight="semibold" style={{ color: "white" }}>
          {isLoading ? "Verificando..." : rateLimited ? "Aguarde..." : "Verificar código"}
        </ThemedText>
      </Button>

      {/* Resend Button */}
      {onResendCode && (
        <View style={styles.resendContainer}>
          <Button onPress={handleResend} disabled={isResending || resendCooldown > 0 || rateLimited} variant="link" size="default">
            {isResending && <LoadingSpinner size="sm" style={{ marginRight: spacing.sm }} />}
            <ThemedText size="base" weight="semibold" style={{ color: resendCooldown > 0 || rateLimited ? colors.mutedForeground : colors.primary }}>
              {isResending ? "Reenviando..." : resendCooldown > 0 ? `Reenviar em ${resendCooldown}s` : rateLimited ? "Aguarde para reenviar" : "Reenviar código"}
            </ThemedText>
          </Button>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.lg,
  },
  alert: {
    padding: spacing.md,
    borderRadius: 8,
    borderWidth: 1,
  },
  inputContainer: {
    alignItems: "center",
  },
  resendContainer: {
    alignItems: "center",
  },
});
