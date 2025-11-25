import { Component, ErrorInfo, ReactNode } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";

import * as Updates from "expo-updates";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log the error
    console.error("ErrorBoundary caught an error:", error, errorInfo);

    // Check if it's a hook call error
    if (error.message.includes("Invalid hook call")) {
      console.warn("Detected React hook call error. This might be due to authentication state changes.");

      // Don't auto-reload immediately to prevent infinite loops
      // Instead, provide manual retry option
      console.log("Hook error detected, providing manual recovery options");
    }

    // Check if it's an authentication error
    if (error.message.includes("401") || error.message.includes("Unauthorized") || error.message.includes("Sessão inválida")) {
      console.warn("Authentication error detected in error boundary");
      // Clear any stored auth data to force clean login
      try {
        import("@/utils/storage").then(({ removeStoredToken, removeUserData }) => {
          removeStoredToken();
          removeUserData();
        });
      } catch (cleanupError) {
        console.error("Failed to cleanup auth data:", cleanupError);
      }
    }
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: undefined });
  };

  private handleReload = async () => {
    try {
      await Updates.reloadAsync();
    } catch (error) {
      console.error("Failed to reload app:", error);
      // Fallback to manual retry
      this.handleRetry();
    }
  };

  public render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const isHookError = this.state.error?.message.includes("Invalid hook call");

      return (
        <View style={styles.container}>
          <View style={styles.card}>
            <View style={styles.iconContainer}>
              <Text style={styles.icon}>⚠️</Text>
            </View>
            <Text style={styles.title}>Algo deu errado</Text>
            <Text style={styles.message}>
              {isHookError ? "Detectamos um problema de autenticação. O aplicativo será recarregado automaticamente." : "Ocorreu um erro inesperado. Tente novamente."}
            </Text>
            {!isHookError && (
              <View style={styles.buttonContainer}>
                <TouchableOpacity style={StyleSheet.flatten([styles.button, styles.primaryButton])} onPress={this.handleRetry}>
                  <Text style={styles.primaryButtonText}>Tentar novamente</Text>
                </TouchableOpacity>
                <TouchableOpacity style={StyleSheet.flatten([styles.button, styles.secondaryButton])} onPress={this.handleReload}>
                  <Text style={styles.secondaryButtonText}>Recarregar app</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    padding: 20,
  },
  card: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    width: "100%",
    maxWidth: 300,
    alignItems: "center",
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#fee2e2",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  icon: {
    fontSize: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: "600",
    color: "#1f2937",
    marginBottom: 8,
    textAlign: "center",
  },
  message: {
    fontSize: 14,
    color: "#6b7280",
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 20,
  },
  buttonContainer: {
    width: "100%",
    gap: 12,
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  primaryButton: {
    backgroundColor: "#2563eb",
  },
  secondaryButton: {
    backgroundColor: "#f3f4f6",
    borderWidth: 1,
    borderColor: "#d1d5db",
  },
  primaryButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "500",
  },
  secondaryButtonText: {
    color: "#374151",
    fontSize: 14,
    fontWeight: "500",
  },
});
