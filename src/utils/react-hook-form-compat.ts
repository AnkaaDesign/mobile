/**
 * React Hook Form React 19 Compatibility Utilities
 *
 * This file provides compatibility helpers for React Hook Form
 * when used with React 19, addressing known compatibility issues.
 */

import { useEffect, useRef } from "react";
import type { Control, FieldPath, FieldValues } from "react-hook-form";

/**
 * Enhanced Controller wrapper that handles React 19 compatibility issues
 * Prevents setState warnings during render cycles
 */
export function useControllerCompat<TFieldValues extends FieldValues = FieldValues, TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>>(
  control: Control<TFieldValues>,
  name: TName,
) {
  const renderCountRef = useRef(0);

  useEffect(() => {
    renderCountRef.current += 1;
  });

  return {
    control,
    name,
    // Add stability markers for React 19
    key: `${name}-${renderCountRef.current}`,
  };
}

/**
 * Wrapper for field onChange that prevents React 19 warnings
 */
export function createFieldChangeHandler(onChange: (value: any) => void) {
  return (value: any) => {
    // Use setTimeout to prevent setState during render warnings
    setTimeout(() => onChange(value), 0);
  };
}
