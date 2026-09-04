export type EventType =
  | 'BOOKING_CREATED'
  | 'BOOKING_CONFIRMED'
  | 'BOOKING_CANCELLED'
  | 'BOOKING_SEATED'
  | 'REMINDER_DUE'
  | 'FEEDBACK_RECEIVED'
  | 'CAMPAIGN_TRIGGER';

export interface AutomationLog {
  id: string;
  restaurantId: string;
  restaurantName?: string;
  eventId: string;
  eventType: EventType;
  timestamp: string;
  status: 'SUCCESS' | 'TEST_MODE' | 'FAILED' | 'RETRYING';
  recipientPhone: string;
  recipientName: string;
  responseStatus: number;
  responseBody?: string;
  durationMs: number;
  payload: Record<string, unknown>;
}
