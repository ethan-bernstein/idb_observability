import { database, setStatus, table1 } from './index';

// Reproduce one transaction holding a write lock on a table causing reads to have to wait.
export async function reproLongWriteLock() {
    const id = 'another';
    await table1.put({id});
    longWrite(5000);
    return new Promise<void>(resolve => {
        const readAndResolve = async () => {
            await table1.get(id);
            resolve();
        }
        setTimeout(readAndResolve, 0);
    });
}

// Reproduce a long readwrite transaction blocking other
async function longWrite(duration: number) {
    const start = Date.now();
    await database.transaction('rw', table1, async () => {
        setStatus('starting slow write');
        const id = 'LongWriteLock';
        while (Date.now() < start + duration) {
            await table1.put({id});
            await table1.get(id);
        }
    });
}
