// Optimized Layout - Fixed version that avoids "property is not configurable" error
// This version uses the privilege-optimized system but with proper configuration

import React from 'react';
import { PrivilegeOptimizedFullLayout } from '@/navigation/privilege-optimized-full-fixed';

export default function TabsLayout() {
  return <PrivilegeOptimizedFullLayout />;
}
