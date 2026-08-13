use crate::bus::Bus;

pub fn subscribe(_bus: Bus) {
    let _ = Bus;
    events_recv();
}

fn events_recv() {
    let _ = crate::bus::events;
}
