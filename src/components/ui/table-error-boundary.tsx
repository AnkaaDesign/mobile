import React, { Component, ReactNode } from "react";
import { View, TouchableOpacity, StyleSheet } from "react-native";
import { IconAlertCircle } from "@tabler/icons-react-native";
import { ThemedText } from "./themed-text";
import { extendedColors } from "@/lib/theme/extended-colors";

interface TableErrorBoundaryProps {
  children: ReactNode;
  onRetry?: () => void;
}

interface TableErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class TableErrorBoundary extends Component<TableErrorBoundaryProps, TableErrorBoundaryState> {
  constructor(props: TableErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): TableErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Table Error:", error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
    this.props.onRetry?.();
  };

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.errorContainer}>
          <IconAlertCircle size={48} color={extendedColors.red[600]} />
          <ThemedText style={styles.errorTitle}>Erro ao carregar a tabela</ThemedText>
          <ThemedText style={styles.errorMessage}>{this.state.error?.message || "Ocorreu um erro inesperado"}</ThemedText>
          <TouchableOpacity style={styles.retryButton} onPress={this.handleRetry}>
            <ThemedText style={styles.retryText}>Tentar Novamente</ThemedText>
          </TouchableOpacity>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginTop: 12,
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 14,
    textAlign: "center",
    marginBottom: 20,
    opacity: 0.7,
  },
  retryButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: extendedColors.green[700],
    borderRadius: 8,
  },
  retryText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "500",
  },
});
