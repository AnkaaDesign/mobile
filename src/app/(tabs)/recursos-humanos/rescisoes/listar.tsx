import { Layout } from "@/components/list/Layout";
import { terminationsListConfig } from "@/config/list/hr/terminations";

export default function TerminationListScreen() {
  return <Layout config={terminationsListConfig} />;
}
