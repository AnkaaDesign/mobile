import { Component, ErrorInfo, ReactNode } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from "react-native";
import * as Updates from "expo-updates";
import { router } from "expo-router";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): Partial<State> {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log the error with full details
    console.error("[ErrorBoundary] Caught error:", error.message);
    console.error("[ErrorBoundary] Component stack:", errorInfo.componentStack);

    // Store error info for display in dev mode
    this.setState({ errorInfo });

    // Note: Authentication errors are handled by the auth context's error handler
    // ErrorBoundary should NOT clear auth data as it would cause unexpected logouts
    // The user stays logged in and can retry the action
  }

  private navigateToHome = () => {
    // Navigate to home screen - we can't use router.back() because the navigation
    // Stack was unmounted when ErrorBoundary showed its error UI.
    // The user stays logged in - this just navigates to a safe location.
    console.log("[ErrorBoundary] Navigating to home screen");

    // Navigate FIRST, then reset error state
    // This ensures the navigation happens immediately before any other code can redirect
    try {
      console.log("[ErrorBoundary] Executing navigation to home");
      router.replace('/(tabs)/inicio' as any);
    } catch (error) {
      console.error("[ErrorBoundary] Error navigating to home:", error);
    }

    // Reset error state after navigation is initiated
    // Use setTimeout to let the navigation take effect first
    setTimeout(() => {
      this.setState({
        hasError: false,
        error: undefined,
        errorInfo: undefined,
      });
    }, 50);
  };

  private handleGoBack = () => {
    this.navigateToHome();
  };

  private handleRetry = () => {
    // Reset error state and navigate to home
    // We can't just reset and hope to restore the previous screen because
    // React remounts the entire subtree fresh when ErrorBoundary resets,
    // which loses navigation state and causes the app to go to index route.
    console.log("[ErrorBoundary] Retrying - resetting error state and navigating to home");
    this.navigateToHome();
  };

  private handleReload = async () => {
    try {
      console.log("[ErrorBoundary] Reloading app");
      await Updates.reloadAsync();
    } catch (error) {
      console.error("[ErrorBoundary] Failed to reload app:", error);
      // Fallback to just resetting error state
      this.setState({
        hasError: false,
        error: undefined,
        errorInfo: undefined,
      });
    }
  };

  public render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const errorMessage = this.state.error?.message || "Erro desconhecido";

      return (
        <View style={styles.container}>
          <View style={styles.card}>
            <View style={styles.iconContainer}>
              <Text style={styles.icon}>⚠️</Text>
            </View>
            <Text style={styles.title}>Algo deu errado</Text>
            <Text style={styles.message}>
              Ocorreu um erro inesperado. Você continua logado - tente novamente.
            </Text>

            {/* Show error details in development mode */}
            {__DEV__ && (
              <ScrollView style={styles.errorDetails} contentContainerStyle={styles.errorDetailsContent}>
                <Text style={styles.errorTitle}>Erro:</Text>
                <Text style={styles.errorText}>{errorMessage}</Text>
                {this.state.errorInfo?.componentStack && (
                  <>
                    <Text style={styles.errorTitle}>Stack:</Text>
                    <Text style={styles.errorText} numberOfLines={10}>
                      {this.state.errorInfo.componentStack.trim().slice(0, 500)}
                    </Text>
                  </>
                )}
              </ScrollView>
            )}

            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={StyleSheet.flatten([styles.button, styles.primaryButton])}
                onPress={this.handleRetry}
              >
                <Text style={styles.primaryButtonText}>Tentar novamente</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={StyleSheet.flatten([styles.button, styles.secondaryButton])}
                onPress={this.handleGoBack}
              >
                <Text style={styles.secondaryButtonText}>Ir para Início</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={StyleSheet.flatten([styles.button, styles.tertiaryButton])}
                onPress={this.handleReload}
              >
                <Text style={styles.tertiaryButtonText}>Recarregar app</Text>
              </TouchableOpacity>
            </View>
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
  tertiaryButton: {
    backgroundColor: "transparent",
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
  tertiaryButtonText: {
    color: "#6b7280",
    fontSize: 14,
    fontWeight: "500",
  },
  errorDetails: {
    maxHeight: 150,
    width: "100%",
    marginBottom: 16,
    backgroundColor: "#fef2f2",
    borderRadius: 8,
    padding: 12,
  },
  errorDetailsContent: {
    gap: 4,
  },
  errorTitle: {
    fontSize: 12,
    fontWeight: "600",
    color: "#991b1b",
    marginTop: 8,
  },
  errorText: {
    fontSize: 11,
    color: "#7f1d1d",
    fontFamily: "monospace",
  },
});
