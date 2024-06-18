import type { Table } from 'dexie';
import { RunBatchesOfWorkersUntilSlowRead } from './RunBatchesOfWorkersUntilSlowRead';
import { table1 } from './index';

// Reproduce slow operations due to IndexedDB throughtput. Send small operations at a high
// enough rate that idb can't keep up.
export function reproThroughput() {
    const runner = new ThroughputRunner(table1, 5000, 20);
    return runner.run();
}

class ThroughputRunner extends RunBatchesOfWorkersUntilSlowRead {
    largeString: string;

    constructor(table: Table, targetDuration: number, batchSize: number) {
        super(table, targetDuration, batchSize);
        this.largeString = 'largeString';
        while (this.largeString.length < 100000) {
            this.largeString += this.largeString;
        }
    }

    runTask = (workerId: number) => this.table.put({id: workerId, data: this.largeString});
}

