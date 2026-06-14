import { Layout } from "@/components/list/Layout";
import { medicalExamsListConfig } from "@/config/list/hr/medical-exams";
import { useScreenReady } from "@/hooks/use-screen-ready";

export default function MedicalExamListScreen() {
  useScreenReady();
  return <Layout config={medicalExamsListConfig} />;
}
