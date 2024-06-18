import { setStatus, table1, table2 } from './index';

// Reproduce one slow read causing slow reads in another table.
// The goal would be to help the client identify the codepath of the slow read that blocked other reads
export async function reproHeavyReader() {
    const id = 'HeavyReader';

    setStatus('preparing table');
    let duration = 0;
    let i = 0;
    let nextBatchSize = 100000;
    while (duration < 5000) {
        const items: any[] = [];
        for (let j = i; j < i + nextBatchSize; j++) {
            items.push({id: 'HeavyReader' + (i + j), data: 'Here is some more text'});
        }
        i += nextBatchSize;
        nextBatchSize *= 2;
        await table2.bulkPut(items);
        const start = Date.now();
        setStatus(`preparing - testing read with ${i} items`);
        await table2.toArray();
        duration = Date.now() - start;
        setStatus('preparing - read duration ' + duration);
    }

    setStatus('running slow read');
    table2.toArray();
    return new Promise<void>(resolve => {
        const readAndResolve = async () => {
            await table1.get(id);
            resolve();
        }
        setTimeout(readAndResolve, 0);
    });
}

