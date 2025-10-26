import { AIRBRUSHING_STATUS_LABELS } from '../constants';
import { AIRBRUSHING_STATUS } from '../constants';

/**
 * Map AIRBRUSHING_STATUS enum to string
 */
export function mapAirbrushingStatusToPrisma(status: AIRBRUSHING_STATUS | string): string {
  return status as string;
}

export function getAirbrushingStatusLabel(status: AIRBRUSHING_STATUS): string {
  return AIRBRUSHING_STATUS_LABELS[status] || status;
}
