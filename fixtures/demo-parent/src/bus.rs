pub struct Bus;

impl Bus {
    pub fn publish(&self) {
        let _ = crate::bus::events;
        encode();
        flush();
    }
}

pub fn encode() {
    flush();
}

pub fn flush() {}

/// Channel sink endpoint (plugin maps Channel-typed consts onto Endpoint).
pub const events: BroadcastChannel = BroadcastChannel;

pub struct BroadcastChannel;
