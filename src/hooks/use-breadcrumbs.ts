import { useMemo } from "react";
import { usePathname, useSegments } from "expo-router";
import { ROUTE_LABELS, BreadcrumbSegment } from "@/components/ui/breadcrumb";

export interface BreadcrumbConfig {
  /**
   * Custom label for this route
   */
  label?: string;
  /**
   * Custom path (overrides auto-generated)
   */
  path?: string;
  /**
   * Whether to hide this segment
   */
  hidden?: boolean;
  /**
   * Custom label getter that receives the current segment
   */
  labelGetter?: (segment: string) => string | undefined;
}

export interface UseBreadcrumbsOptions {
  /**
   * Configuration for each route segment (by index or segment name)
   */
  config?: Record<string, BreadcrumbConfig>;
  /**
   * Function to get dynamic labels (e.g., from API data)
   */
  getDynamicLabel?: (segment: string, index: number) => string | undefined;
  /**
   * Whether to include home segment
   */
  includeHome?: boolean;
}

/**
 * Hook to generate breadcrumb segments from current route
 * with support for custom labels and dynamic data
 */
export function useBreadcrumbs(options: UseBreadcrumbsOptions = {}): BreadcrumbSegment[] {
  const { config = {}, getDynamicLabel, includeHome = false } = options;
  const pathname = usePathname();
  const segments = useSegments();

  return useMemo(() => {
    const breadcrumbs: BreadcrumbSegment[] = [];
    let currentPath = "";

    segments.forEach((segment, index) => {
      // Skip empty segments and route groups (unless configured otherwise)
      if (!segment || (segment.startsWith("(") && !config[segment])) return;

      // Check if this segment should be hidden
      const segmentConfig = config[segment] || config[index.toString()];
      if (segmentConfig?.hidden) return;

      // Build path incrementally
      currentPath += `/${segment}`;

      // Get custom path if provided
      const path = segmentConfig?.path || currentPath;

      // Determine if this is a dynamic segment
      const isDynamic = segment.startsWith("[") || /^[a-f0-9-]{36}$/i.test(segment) || /^\d+$/.test(segment);

      // Get label with priority: custom > dynamic > mapping > default
      let label: string;

      if (segmentConfig?.label) {
        // Custom label from config
        label = segmentConfig.label;
      } else if (segmentConfig?.labelGetter) {
        // Custom label getter
        label = segmentConfig.labelGetter(segment) || segment;
      } else if (getDynamicLabel) {
        // Dynamic label from options
        const dynamicLabel = getDynamicLabel(segment, index);
        if (dynamicLabel) {
          label = dynamicLabel;
        } else {
          label = getLabelFromSegment(segment, isDynamic, segments[index - 1]);
        }
      } else {
        // Default label generation
        label = getLabelFromSegment(segment, isDynamic, segments[index - 1]);
      }

      breadcrumbs.push({
        label,
        path,
        isLast: index === segments.length - 1,
      });
    });

    return breadcrumbs;
  }, [segments, pathname, config, getDynamicLabel]);
}

/**
 * Get label for a segment
 */
function getLabelFromSegment(segment: string, isDynamic: boolean, previousSegment?: string): string {
  // Check if in mapping
  if (ROUTE_LABELS[segment]) {
    return ROUTE_LABELS[segment];
  }

  // For dynamic segments, try to create a meaningful label
  if (isDynamic) {
    const prevLabel = previousSegment ? ROUTE_LABELS[previousSegment] : undefined;
    if (prevLabel) {
      return prevLabel;
    }
    return "Detalhes";
  }

  // Capitalize and clean segment
  return segment
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/**
 * Helper to create breadcrumb segments for common patterns
 */
export const breadcrumbHelpers = {
  /**
   * Create breadcrumbs for a detail page
   */
  forDetail: (
    sectionLabel: string,
    sectionPath: string,
    entityLabel: string,
    entityPath: string,
    detailLabel: string
  ): BreadcrumbSegment[] => [
    { label: sectionLabel, path: sectionPath },
    { label: entityLabel, path: entityPath },
    { label: detailLabel, path: "", isLast: true },
  ],

  /**
   * Create breadcrumbs for a list page
   */
  forList: (sectionLabel: string, sectionPath: string, listLabel: string, listPath: string): BreadcrumbSegment[] => [
    { label: sectionLabel, path: sectionPath },
    { label: listLabel, path: listPath, isLast: true },
  ],

  /**
   * Create breadcrumbs for an edit page
   */
  forEdit: (
    sectionLabel: string,
    sectionPath: string,
    entityLabel: string,
    entityPath: string,
    detailLabel: string,
    detailPath: string
  ): BreadcrumbSegment[] => [
    { label: sectionLabel, path: sectionPath },
    { label: entityLabel, path: entityPath },
    { label: detailLabel, path: detailPath },
    { label: "Editar", path: "", isLast: true },
  ],

  /**
   * Create breadcrumbs for a create page
   */
  forCreate: (sectionLabel: string, sectionPath: string, entityLabel: string, entityPath: string): BreadcrumbSegment[] => [
    { label: sectionLabel, path: sectionPath },
    { label: entityLabel, path: entityPath },
    { label: "Cadastrar", path: "", isLast: true },
  ],

  /**
   * Create production schedule breadcrumbs
   */
  forScheduleDetail: (taskName: string, taskId: string): BreadcrumbSegment[] => [
    { label: "Produção", path: "/(tabs)/production" },
    { label: "Cronograma", path: "/(tabs)/production/schedule" },
    { label: taskName, path: `/(tabs)/production/schedule/details/${taskId}`, isLast: true },
  ],

  /**
   * Create administration customer breadcrumbs
   */
  forCustomerDetail: (customerName: string, customerId: string): BreadcrumbSegment[] => [
    { label: "Administração", path: "/(tabs)/administration" },
    { label: "Clientes", path: "/(tabs)/administration/customers" },
    { label: customerName, path: `/(tabs)/administration/customers/details/${customerId}`, isLast: true },
  ],

  /**
   * Create inventory product breadcrumbs
   */
  forProductDetail: (productName: string, productId: string): BreadcrumbSegment[] => [
    { label: "Estoque", path: "/(tabs)/inventory" },
    { label: "Produtos", path: "/(tabs)/inventory/products" },
    { label: productName, path: `/(tabs)/inventory/products/details/${productId}`, isLast: true },
  ],
};

/**
 * Hook to get breadcrumb segments with entity data
 * Useful for detail pages where you want to show the entity name
 */
export function useBreadcrumbsWithEntity<T extends { id: string; name?: string }>(
  entity: T | undefined,
  baseBreadcrumbs: BreadcrumbSegment[],
  entityNameKey: keyof T = "name" as keyof T
): BreadcrumbSegment[] {
  return useMemo(() => {
    if (!entity) return baseBreadcrumbs;

    const breadcrumbs = [...baseBreadcrumbs];
    const lastSegment = breadcrumbs[breadcrumbs.length - 1];

    if (lastSegment && entity[entityNameKey]) {
      lastSegment.label = String(entity[entityNameKey]);
    }

    return breadcrumbs;
  }, [entity, baseBreadcrumbs, entityNameKey]);
}
