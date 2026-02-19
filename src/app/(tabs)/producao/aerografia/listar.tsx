import { Layout } from '@/components/list/Layout'
import { airbrushingListConfig } from '@/config/list/production/airbrushing'
import { useScreenReady } from '@/hooks/use-screen-ready';

export default function AirbrushingListScreen() {
  useScreenReady();
  return <Layout config={airbrushingListConfig} />
}
