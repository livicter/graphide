typedef struct BroadcastChannel {
  int unused;
} BroadcastChannel;

BroadcastChannel events;

typedef struct Bus {
  int unused;
} Bus;

BroadcastChannel publish(Bus b) {
  encode();
  flush();
  return events;
}

void encode(void) { flush(); }

void flush(void) {}
