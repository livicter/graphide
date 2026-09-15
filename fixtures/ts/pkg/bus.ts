class BroadcastChannel {}

const events: BroadcastChannel = new BroadcastChannel();

class Bus {
  publish(): BroadcastChannel {
    encode();
    flush();
    return events;
  }
}

function encode(): void {
  flush();
}

function flush(): void {}

export { Bus, events };
