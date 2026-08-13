pub struct Bus;

impl Bus {
    pub fn publish(&self) {
        let _ = crate::bus::events;
        events_send();
    }
}

fn events_send() {}

/// Channel sink endpoint (deriver heuristic: name + channel token).
pub const events: BroadcastChannel = BroadcastChannel;

pub struct BroadcastChannel;
