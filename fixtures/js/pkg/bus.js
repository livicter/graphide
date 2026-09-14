class BroadcastChannel {}

const events = new BroadcastChannel();

class Bus {
  publish() {
    encode();
    flush();
    return events;
  }
}

function encode() {
  flush();
}

function flush() {}

export { Bus, events };
