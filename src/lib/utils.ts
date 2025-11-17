import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Utility to create theme-aware class names with fallbacks
export function createThemedClassName(baseClasses: string, isDark: boolean): string {
  // For React Native, we'll use explicit dark: variants since CSS variables aren't reliable
  const lightClasses = baseClasses;
  const darkClasses = baseClasses
    .replace(/bg-background/g, "bg-dark-background")
    .replace(/text-foreground/g, "text-dark-foreground")
    .replace(/bg-card/g, "bg-dark-card")
    .replace(/text-card-foreground/g, "text-dark-card-foreground")
    .replace(/bg-muted/g, "bg-dark-muted")
    .replace(/text-muted-foreground/g, "text-dark-muted-foreground")
    .replace(/bg-secondary/g, "bg-dark-secondary")
    .replace(/text-secondary-foreground/g, "text-dark-secondary-foreground")
    .replace(/border-border/g, "border-dark-border");

  return isDark ? darkClasses : lightClasses;
}
