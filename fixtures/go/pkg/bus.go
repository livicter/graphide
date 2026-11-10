package pkg

type BroadcastChannel struct{}

var events = BroadcastChannel{}

type Bus struct{}

func (b Bus) publish() BroadcastChannel {
	encode()
	flush()
	return events
}

func encode() {
	flush()
}

func flush() {
}
