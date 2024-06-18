import type { Table } from 'dexie';
import { RunBatchesOfWorkersUntilSlowRead } from './RunBatchesOfWorkersUntilSlowRead';
import { table1 } from './index';

// Reproduce slow operations due to js contention.
export function reproJsContention() {
    const runner = new JsContentionRunner(table1, 5000, 10, 25);
    return runner.run();
}

class JsContentionRunner extends RunBatchesOfWorkersUntilSlowRead {
    busyDuration: number;

    constructor(table: Table, targetDuration: number, batchSize: number, busyDuration: number) {
        super(table, targetDuration, batchSize);
        this.busyDuration = busyDuration;
    }

    runTask = (workerId: number) => {
        const endTime = Date.now() + this.busyDuration;
        for (let i = 0; Date.now() < endTime; i++) {
            i = i - 1;
        }
    }
}
