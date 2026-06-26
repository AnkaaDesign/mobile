// Optimized Layout - Fixed version that avoids "property is not configurable" error
// This version uses the privilege-optimized system but with proper configuration

import { PrivilegeLayout } from '@/navigation/privilege-layout';

export default function TabsLayout() {
  return <PrivilegeLayout />;
}
