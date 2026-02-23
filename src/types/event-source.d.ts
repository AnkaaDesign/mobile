declare class EventSource {
  constructor(url: string);
  onopen: ((event: Event) => void) | null;
  onmessage: ((event: MessageEvent) => void) | null;
  onerror: ((event: Event) => void) | null;
  close(): void;
}

declare class MessageEvent {
  data: string;
}
