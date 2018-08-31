type EventListener = (...args: any[]) => void;

interface EventListenerMap {
    [name: string]: EventListener[] | undefined;
}

export class EventHelper {
    private readonly listenerMap: EventListenerMap = {};

    on(event: string, listener: EventListener) {
        let listeners = this.listenerMap[event];
        if (!listeners) {
            listeners = this.listenerMap[event] = [];
        }
        listeners.push(listener);
    }

    off(event: string, listener: EventListener) {
        const listeners = this.listenerMap[event];
        if (!listeners) {
            return;
        }
        let i: number;
        for (i = 0; i < listeners.length; i ++) {
            if (listeners[i] === listener) {
                listeners.splice(i, 1);
                break;
            }
        }
    }

    emit(event: string, ...args: any[]) {
        const listeners = this.listenerMap[event];
        if (listeners) {
            for (const listener of listeners) {
                listener.apply(null, args);
            }
        }
    }
}
