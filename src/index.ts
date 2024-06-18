import Dexie from 'dexie';
import { reproHeavyReader } from './reproHeavyReader';
import { reproJsContention } from './reproJsContention';
import { reproLongWriteLock } from './reproLongWriteLock';
import { reproThroughput } from './reproThroughput';
import { MeasureTransaction } from './MeasureTransaction';
import worker_delay_script from './workerDelay';
import busy_worker_script from './busyWorker';

class Database extends Dexie {
    constructor() {
        super('idb-observability-tests');
        this.version(1).stores({
            table1: 'id',
            table2: 'id',
        });

        this.use({
            stack: 'dbcore',
            name: MeasureTransaction.name,
            create: MeasureTransaction,
        });
    }
}

export const database = new Database();
export const table1 = database.table('table1');
export const table2 = database.table('table2');

let statusText: HTMLElement;

export const setStatus = (value: string) => statusText.innerText = value;
export const runWithStatus = async (fn: () => Promise<unknown>) => {
    setStatus('running');
    await fn();
    setStatus('clearing tables');
    await table1.clear();
    await table2.clear();
    setStatus('idle');
}

document.addEventListener("DOMContentLoaded", () => {
    const longWriteLockButton = document.getElementById('longWriteLockButton')!;
    const heavyReaderButton = document.getElementById('heavyReaderButton')!;
    const throughputButton = document.getElementById('throughputButton')!;
    const jsContentionButton = document.getElementById('jsContentionButton')!;
    const workerDelayButton = document.getElementById('workerDelayButton')!;
    const busyWorkerButton = document.getElementById('busyWorkerButton')!;
    statusText = document.getElementById('statusText')!;
  
    // If the worker in before the execution of the ui event (button click), then the worker will execute immediately.
    // var workerDelayScript = new Worker(worker_delay_script);
    let busyWorkerScript = new Worker(busy_worker_script);
    var busyWorkerIndex = 0;
    var workerDelayIndex = 0;
    const runWithStatus = async (fn: () => Promise<unknown>) => {
        setStatus('running');
        await fn();
        setStatus('idle');
    }
    longWriteLockButton.onclick = (event) => {
        runWithStatus(reproLongWriteLock);
    };
    heavyReaderButton.onclick = (event) => {
        runWithStatus(reproHeavyReader);
    };
    throughputButton.onclick = (event) => {
        runWithStatus(reproThroughput);
    };
    jsContentionButton.onclick = (event) => {
        runWithStatus(reproJsContention);
    };

    workerDelayButton.onclick = (event) => {
        console.log('Hello from the main thread! I am going to invoke worker.');
        var workerName = 'DelayedWorker#' + workerDelayIndex;
        // If a new worker is initialized in the current stack, then the worker will not execute immediately. Use initialization in line 50 for immediate execution.
        var workerDelayScript = new Worker(worker_delay_script,{ name: workerName});
        workerDelayIndex++;
        var clickTime = new Date();
        workerDelayScript.postMessage(clickTime);
        workerDelayScript.onmessage = (event) => {
            var currentTime = new Date();
            console.log(workerName + ': Back in Main thread. I was called from the worker at: ', event.data.toLocaleTimeString(), 'and I am running at: ', currentTime.toLocaleTimeString());
        };
        
        // wait for 2 seconds
        const start = Date.now();
        while (Date.now() - start < 4000) { /* do nothing */ }

        console.log('Ending the main stack.');
    };


    // Every time we click this button we queue the event to the worker thread's main event loop. This event will be processed by the worker thread when it is free, irrespective of the state of main thread.
    busyWorkerButton.onclick = (event) => {
        var clickTime = new Date();
        busyWorkerScript.postMessage({'clickTime': clickTime, 'index': busyWorkerIndex});
        console.log('From main thread. Invoked work #' + busyWorkerIndex);
        busyWorkerScript.onmessage = (event) => {
            console.log('Busy work idx: ', event.data.index, ' called at: ', clickTime.toLocaleTimeString());
            console.log('Busy work idx: ', event.data.index, ' work started at: ', event.data.workerStartTime.toLocaleTimeString());
            console.log('Busy work idx: ', event.data.index, ' completed the work at: ', new Date().toLocaleTimeString());
        };
        busyWorkerIndex++;
    };

    setStatus('idle');
});

