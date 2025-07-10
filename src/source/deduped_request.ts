import type Scheduler from "../util/scheduler";
import type {Callback} from "../types/callback";

export class DedupedRequest {
    entries: {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        [key: string]: any;
    };
    scheduler: Scheduler | null | undefined;

    constructor(scheduler?: Scheduler) {
        this.entries = {};
        this.scheduler = scheduler;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    request(key: string, metadata: any, request: any, callback: Callback<any>): () => void {
        const entry = this.entries[key] = this.entries[key] || {callbacks: []};

        if (entry.result) {
            const [err, result] = entry.result;
            if (this.scheduler) {
                this.scheduler.add(() => {
                    callback(err, result);
                }, metadata);
            } else {
                callback(err, result);
            }
            return () => {};
        }

        entry.callbacks.push(callback);

        if (!entry.cancel) {
            entry.cancel = request((err, result) => {
                entry.result = [err, result];
                for (const cb of entry.callbacks) {
                    if (this.scheduler) {
                        this.scheduler.add(() => {
                            cb(err, result);
                        }, metadata);
                    } else {
                        cb(err, result);
                    }
                }
                setTimeout(() => delete this.entries[key], 1000 * 3);
            });
        }

        return () => {
            if (entry.result) return;
            entry.callbacks = entry.callbacks.filter(cb => cb !== callback);
            if (!entry.callbacks.length) {
                entry.cancel();
                delete this.entries[key];
            }
        };
    }
}
