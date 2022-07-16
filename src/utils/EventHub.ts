export class EventSubscription<Data, Listener extends VoidFN<Data> = VoidFN<Data>> {
  listeners: Listener[] = []

  emit(data: Data) {
    for (const listener of this.listeners) listener(data)
  }

  addEventListener(listener: Listener) {
    this.listeners.push(listener)
    return () => this.removeEventListener(listener)
  }

  removeEventListener(listener: Listener) {
    const index = this.listeners.indexOf(listener)
    if (index !== -1) this.listeners.splice(index, 1)
  }
}

export class EventHub<
  Shape extends {
    [event: string]: unknown
  },
> {
  ports: {
    [key in keyof Shape]: EventSubscription<Shape[key]>
  } = {} as EventHub<Shape>['ports']

  getPort<Event extends keyof Shape>(event: Event) {
    if (!this.ports[event]) this.ports[event] = new EventSubscription<Shape[typeof event]>()

    return this.ports[event]
  }

  emit<Event extends keyof Shape>(event: Event, data: Shape[Event]) {
    const port = this.getPort(event)
    return port.emit(data)
  }

  addEventListener<Event extends keyof Shape>(
    event: Event,
    listener: (data: Shape[Event]) => void,
  ) {
    const port = this.getPort(event)
    return port.addEventListener(listener)
  }

  removeEventListener<Event extends keyof Shape>(
    event: Event,
    listener: (data: Shape[Event]) => void,
  ) {
    const port = this.getPort(event)
    return port.removeEventListener(listener)
  }
}
