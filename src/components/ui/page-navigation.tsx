import React from "react";
import { View, StyleSheet, ViewStyle } from "react-native";
import { IconChevronLeft, IconChevronRight } from "@tabler/icons-react-native";
import { Button } from "./button";
import { Text } from "./text";
import { useTheme } from "@/lib/theme";
import { spacing, fontSize } from "@/constants/design-system";

interface PageNavigationProps {
  currentPage: number;
  totalPages: number;
  onPageChange?: (page: number) => void;
  style?: ViewStyle;
  showPageNumbers?: boolean;
  maxPageButtons?: number;
}

/**
 * Simple pagination control with previous/next buttons and page numbers
 */
export function PageNavigation({
  currentPage,
  totalPages,
  onPageChange,
  style,
  showPageNumbers = true,
  maxPageButtons = 5,
}: PageNavigationProps) {
  const { colors } = useTheme();

  if (totalPages <= 1) {
    return null;
  }

  const handlePrevious = () => {
    if (currentPage > 1 && onPageChange) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (currentPage < totalPages && onPageChange) {
      onPageChange(currentPage + 1);
    }
  };

  const handlePageClick = (page: number) => {
    if (onPageChange && page !== currentPage) {
      onPageChange(page);
    }
  };

  // Calculate which page numbers to show
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];

    if (totalPages <= maxPageButtons) {
      // Show all pages
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Show first page
      pages.push(1);

      // Calculate range around current page
      const startPage = Math.max(2, currentPage - 1);
      const endPage = Math.min(totalPages - 1, currentPage + 1);

      // Add ellipsis if needed
      if (startPage > 2) {
        pages.push("...");
      }

      // Add pages around current
      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }

      // Add ellipsis if needed
      if (endPage < totalPages - 1) {
        pages.push("...");
      }

      // Show last page
      pages.push(totalPages);
    }

    return pages;
  };

  const pageNumbers = getPageNumbers();

  return (
    <View style={[styles.container, style]}>
      {/* Previous Button */}
      <Button
        variant="outline"
        size="sm"
        onPress={handlePrevious}
        disabled={currentPage === 1}
        style={styles.navButton}
      >
        <IconChevronLeft size={16} color={currentPage === 1 ? colors.mutedForeground : colors.foreground} />
      </Button>

      {/* Page Numbers */}
      {showPageNumbers && (
        <View style={styles.pageNumbers}>
          {pageNumbers.map((page, index) => {
            if (page === "...") {
              return (
                <Text key={`ellipsis-${index}`} style={styles.ellipsis}>
                  ...
                </Text>
              );
            }

            const pageNum = page as number;
            const isActive = pageNum === currentPage;

            return (
              <Button
                key={pageNum}
                variant={isActive ? "default" : "ghost"}
                size="sm"
                onPress={() => handlePageClick(pageNum)}
                style={styles.pageButton}
              >
                {String(pageNum)}
              </Button>
            );
          })}
        </View>
      )}

      {/* Simple page indicator (alternative to page numbers) */}
      {!showPageNumbers && (
        <Text style={styles.pageIndicator}>
          Página {currentPage} de {totalPages}
        </Text>
      )}

      {/* Next Button */}
      <Button
        variant="outline"
        size="sm"
        onPress={handleNext}
        disabled={currentPage === totalPages}
        style={styles.navButton}
      >
        <IconChevronRight size={16} color={currentPage === totalPages ? colors.mutedForeground : colors.foreground} />
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
  },
  navButton: {
    minWidth: 40,
  },
  pageNumbers: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  pageButton: {
    minWidth: 40,
  },
  ellipsis: {
    fontSize: fontSize.sm,
    paddingHorizontal: spacing.xs,
  },
  pageIndicator: {
    fontSize: fontSize.sm,
    fontWeight: "500",
    paddingHorizontal: spacing.md,
  },
});
