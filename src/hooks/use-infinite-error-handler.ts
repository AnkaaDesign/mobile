import { useCallback, useState } from "react";
import { Alert } from "react-native";

interface InfiniteErrorHandlerOptions {
  maxRetries?: number;
  retryDelay?: number;
  showAlert?: boolean;
  onError?: (error: Error, retryCount: number) => void;
}

/**
 * Hook to handle errors in infinite scroll queries with retry logic
 */
export function useInfiniteErrorHandler(options: InfiniteErrorHandlerOptions = {}) {
  const { maxRetries = 3, retryDelay = 1000, showAlert = true, onError } = options;

  const [retryCount, setRetryCount] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);

  const handleError = useCallback(
    async (error: Error, retryFn?: () => Promise<void> | void) => {
      // Call custom error handler if provided
      onError?.(error, retryCount);

      // Show user-friendly alert if enabled
      if (showAlert && retryCount === 0) {
        const errorMessage = getErrorMessage(error);

        if (retryFn && retryCount < maxRetries) {
          Alert.alert("Erro ao carregar dados", `${errorMessage}\n\nDeseja tentar novamente?`, [
            { text: "Cancelar", style: "cancel" },
            { text: "Tentar novamente", onPress: () => retry(retryFn) },
          ]);
        } else {
          Alert.alert("Erro ao carregar dados", errorMessage, [{ text: "OK" }]);
        }
      }
    },
    [retryCount, maxRetries, showAlert, onError],
  );

  const retry = useCallback(
    async (retryFn: () => Promise<void> | void) => {
      if (retryCount >= maxRetries || isRetrying) {
        return;
      }

      setIsRetrying(true);
      setRetryCount((prev) => prev + 1);

      try {
        // Add delay before retry
        if (retryDelay > 0) {
          await new Promise<void>((resolve) => setTimeout(resolve, retryDelay * retryCount));
        }

        await retryFn();

        // Reset retry count on success
        setRetryCount(0);
      } catch (error) {
        // Handle retry failure
        console.error("Retry failed:", error);

        if (retryCount + 1 >= maxRetries) {
          Alert.alert("Erro persistente", "Não foi possível carregar os dados após várias tentativas. Verifique sua conexão e tente novamente mais tarde.", [{ text: "OK" }]);
        }
      } finally {
        setIsRetrying(false);
      }
    },
    [retryCount, maxRetries, retryDelay, isRetrying],
  );

  const reset = useCallback(() => {
    setRetryCount(0);
    setIsRetrying(false);
  }, []);

  const canRetry = retryCount < maxRetries && !isRetrying;

  return {
    handleError,
    retry,
    reset,
    retryCount,
    isRetrying,
    canRetry,
  };
}

/**
 * Convert error objects to user-friendly messages in Portuguese
 */
function getErrorMessage(error: Error): string {
  const message = error.message?.toLowerCase() || "";

  // Network errors
  if (message.includes("network") || message.includes("fetch")) {
    return "Erro de conexão. Verifique sua internet e tente novamente.";
  }

  // Timeout errors
  if (message.includes("timeout")) {
    return "A requisição demorou muito para responder. Tente novamente.";
  }

  // Server errors
  if (message.includes("500") || message.includes("server")) {
    return "Erro interno do servidor. Tente novamente em alguns instantes.";
  }

  // Authentication errors
  if (message.includes("401") || message.includes("unauthorized")) {
    return "Sessão expirada. Faça login novamente.";
  }

  // Permission errors
  if (message.includes("403") || message.includes("forbidden")) {
    return "Você não tem permissão para acessar esses dados.";
  }

  // Not found errors
  if (message.includes("404") || message.includes("not found")) {
    return "Os dados solicitados não foram encontrados.";
  }

  // Rate limiting
  if (message.includes("429") || message.includes("rate limit")) {
    return "Muitas requisições. Aguarde um momento e tente novamente.";
  }

  // Generic fallback
  return error.message || "Ocorreu um erro inesperado. Tente novamente.";
}
