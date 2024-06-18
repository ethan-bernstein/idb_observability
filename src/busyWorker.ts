const workerFunction = function () {
    //we perform every operation we want in this function right here
    self.onmessage = (event: MessageEvent) => {
        const workerStart = new Date();
        const startTick = Date.now();
        // Print the current date time
        var mainStart = event.data.clickTime;

        console.log('workinstance: ', event.data.index, 'startTime from the main thread:', mainStart.toLocaleTimeString(), 'start time from the worker thread:', workerStart.toLocaleTimeString());

        while (Date.now() - startTick < 4000) { /* do nothing */ }

        postMessage({'workerStartTime': workerStart, 'index': event.data.index});
    };
};
    
//This stringifies the whole function
let codeToString = workerFunction.toString();
//This brings out the code in the bracket in string
let mainCode = codeToString.substring(codeToString.indexOf('{') + 1, codeToString.lastIndexOf('}'));
//convert the code into a raw data
let blob = new Blob([mainCode], { type: 'application/javascript' });
//A url is made out of the blob object and we're good to go
let busy_worker_script = URL.createObjectURL(blob);

export default busy_worker_script;