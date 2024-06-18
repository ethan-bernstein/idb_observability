const workerFunction = function () {
    //we perform every operation we want in this function right here
    self.onmessage = (event: MessageEvent) => {
        var currTime = new Date();
        console.log(self.name + ": was called at: ", event.data.toLocaleTimeString(), "and I am running at: ", currTime.toLocaleTimeString());

        postMessage(new Date());
    };
};
    
//This stringifies the whole function
let codeToString = workerFunction.toString();
//This brings out the code in the bracket in string
let mainCode = codeToString.substring(codeToString.indexOf('{') + 1, codeToString.lastIndexOf('}'));
//convert the code into a raw data
let blob = new Blob([mainCode], { type: 'application/javascript' });
//A url is made out of the blob object and we're good to go
let worker_delay_script = URL.createObjectURL(blob);

export default worker_delay_script;