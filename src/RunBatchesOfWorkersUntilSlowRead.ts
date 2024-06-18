import type { Table } from 'dexie';
import { setStatus } from './index';

// Launch batches of workers until we see a slow read.
export abstract class RunBatchesOfWorkersUntilSlowRead {
    table: Table;
    targetDuration: number;
    batchSize: number;
    workerPromises: Promise<void>[] = [];
    outerResolve: (() => void) | undefined;
    done = false;
    nextWorker = 1;

    // Target duration is how slow a read we want to achieve.
    // BatchSize is how many workers to launch in each batch.
    constructor(table: Table, targetDuration: number, batchSize: number) {
        this.table = table;
        this.targetDuration = targetDuration;
        this.batchSize = batchSize;
    }

    abstract runTask: (workerId: number) => void;

    // Returns a promise which resolves once we have seen a slow read
    // and all workers have noticed and stopped.
    run = () => {
        return new Promise<void>(resolve => {
            this.outerResolve = resolve;
            this.launchBatchesOfWorkers();
        })
    }

    // Launch a batch of workers and then measure how long a read takes.
    // If it's not slow, repeat via setTimeout.
    launchBatchesOfWorkers = async () => {
        if (!this.done) {
            for (let i = 0; i < this.batchSize; i++) {
                setStatus('Starting worker ' + this.nextWorker);
                this.workerPromises.push(new Promise<void>(resolve => {
                    this.runTaskAndSchedule(this.nextWorker++, resolve);
                }))
            }

            const start = Date.now();
            await this.table.get(1);
            const duration = Date.now() - start;

            if (duration > this.targetDuration) {
                this.onDone(duration);
            }

            setTimeout(this.launchBatchesOfWorkers, 0);
        }
    }

    // Worker runs a task repeatedly via setTimeout until we told to stop.
    runTaskAndSchedule = async (workerId: number, workerResolve: () => void) => {
        if (!this.done) {
            await this.runTask(workerId);
        }

        if (this.done) {
            workerResolve();
        } else {
            setTimeout(this.runTaskAndSchedule, 0, workerId, workerResolve);
        }
    }

    // When we have seen a slow read, wait for all workers to notice and stop
    // and then resolve.
    onDone = async (duration: number) => {
        if (!this.done) {
            this.done = true;
            setStatus('Reached slow read ' + duration);
            await Promise.all(this.workerPromises);
            this.outerResolve?.();
        }
    }
}
