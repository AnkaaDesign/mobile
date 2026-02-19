import { Layout } from '@/components/list/Layout'
import { observationsListConfig } from '@/config/list/production/observations'
import { useScreenReady } from '@/hooks/use-screen-ready';

export default function ObservationListScreen() {
  useScreenReady();
  return <Layout config={observationsListConfig} />
}
