use crate::bus::Bus;

pub fn subscribe(_bus: Bus) {
    let _ = crate::bus::events;
    decode();
}

fn decode() {
    handle();
}

fn handle() {}
