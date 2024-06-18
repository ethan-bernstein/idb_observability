import type { DBCore, DbCoreTransactionOptions } from 'dexie';

interface DBCoreTransaction extends IDBTransaction {
    addEventListener(
        type: 'complete' | 'error' | 'abort',
        listener: (...args: any[]) => void,
        options?: boolean | AddEventListenerOptions
    ): void;
}

// Dexie middleware that logs telemetry for each transaction
export function MeasureTransaction(db: DBCore): DBCore {
    return {
        ...db,
        transaction(
            stores: string[],
            mode: 'readonly' | 'readwrite',
            options?: DbCoreTransactionOptions
        ): DBCoreTransaction {
            const start = Date.now();
            const result = db.transaction(stores, mode, options) as DBCoreTransaction;
            const abortController = new AbortController();
            const listenerOptions = {
                once: true,
                signal: abortController.signal,
            };
            const complete = (status: string) => {
                abortController.abort();
                const duration = Date.now() - start;
                console.log(`Duration ${duration} stores ${stores} mode ${mode}`);
            };
            result.addEventListener('complete', () => complete('complete'), listenerOptions);
            result.addEventListener('error', () => complete('error'), listenerOptions);
            result.addEventListener('abort', () => complete('abort'), listenerOptions);

            return result;
        },
    };
}
