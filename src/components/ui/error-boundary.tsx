import React from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { useTheme } from "@/lib/theme";
import { Button } from "./button";
import { Icon } from "./icon";
import { fontSize, fontWeight, spacing, borderRadius } from "@/constants/design-system";

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error: Error; reset: () => void }>;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    try {
      console.error("Error caught by error boundary:", error.message);
      if (errorInfo && errorInfo.componentStack) {
        console.error("Component stack:", errorInfo.componentStack);
      }
    } catch (e) {
      // Ignore logging errors
    }
  }

  reset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError && this.state.error) {
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback;
        return <FallbackComponent error={this.state.error} reset={this.reset} />;
      }

      return <ErrorFallback error={this.state.error} reset={this.reset} />;
    }

    return this.props.children;
  }
}

// Default fallback component
function ErrorFallback({ error, reset }: { error: Error; reset: () => void }) {
  const { colors } = useTheme();
  const [showDetails, setShowDetails] = React.useState(false);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Icon name="alert-triangle" size={48} color={colors.destructive} />

      <Text style={[styles.title, { color: colors.foreground }]}>
        Ops! Algo deu errado
      </Text>

      <Text style={[styles.description, { color: colors.mutedForeground }]}>
        Ocorreu um erro inesperado. Tente recarregar ou entre em contato com o suporte se o problema persistir.
      </Text>

      {__DEV__ && (
        <Pressable
          onPress={() => setShowDetails(!showDetails)}
          style={[styles.detailsButton, { borderColor: colors.border }]}
        >
          <Text style={[styles.detailsButtonText, { color: colors.mutedForeground }]}>
            {showDetails ? "Ocultar detalhes" : "Ver detalhes do erro (desenvolvimento)"}
          </Text>
        </Pressable>
      )}

      {__DEV__ && showDetails && (
        <View style={[styles.errorDetails, { backgroundColor: colors.muted, borderColor: colors.border }]}>
          <Text style={[styles.errorText, { color: colors.foreground }]}>
            {error.toString()}
          </Text>
          {error.stack && (
            <Text style={[styles.stackText, { color: colors.mutedForeground }]}>
              {"\n\n"}
              {error.stack}
            </Text>
          )}
        </View>
      )}

      <Button onPress={reset} variant="outline" style={styles.button}>
        <Icon name="refresh-cw" size={16} color={colors.foreground} />
        <Text style={{ color: colors.foreground, marginLeft: 8 }}>Tentar novamente</Text>
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.lg,
  },
  title: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.semibold,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  description: {
    fontSize: fontSize.sm,
    textAlign: "center",
    marginBottom: spacing.md,
    maxWidth: 320,
  },
  detailsButton: {
    padding: spacing.sm,
    borderWidth: 1,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
  },
  detailsButtonText: {
    fontSize: fontSize.xs,
  },
  errorDetails: {
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    marginBottom: spacing.md,
    maxWidth: "100%",
    maxHeight: 200,
  },
  errorText: {
    fontSize: fontSize.xs,
    fontFamily: "monospace",
  },
  stackText: {
    fontSize: fontSize.xs,
    fontFamily: "monospace",
  },
  button: {
    marginTop: spacing.md,
  },
});

// Hook to use error boundary imperatively
export function useErrorHandler() {
  const [error, setError] = React.useState<Error | null>(null);

  React.useEffect(() => {
    if (error) {
      throw error;
    }
  }, [error]);

  return setError;
}
