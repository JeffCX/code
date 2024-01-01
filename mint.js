// Description: This file is used to run the cli.js file in a loop and write the output to a file.
// Usage: node mint.js <arguments>
// author: x.com/weideyyds
// date: 2023-12-25

// modified by ladboy233
// date: 2023-12-30
// https://twitter.com/Xc1008Cui

// pm2 start mint.js --name "mint-dft-quark" -- mint-dft quark --satsbyte 105
// the parameter after --satsbyte is the max gas used

const { spawn } = require('child_process');
const fs = require('fs');
const axios = require('axios'); // Ensure Axios is imported
const path = require('path');

const dirPath = 'logs';
if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
}

async function getHalfHourFee(minGas) {
    try {
        const response = await axios.get('https://mempool.space/api/v1/fees/recommended');
        const halfHourFee = response.data.halfHourFee;
        return halfHourFee > minGas ? minGas : halfHourFee;
        // return halfHourFee
    } catch (error) {
        console.error('Error fetching fee data:', error);
        return minGas
    }
}

let args = process.argv.slice(2);
args.unshift('dist/cli.js');
console.log(args)

// convert to integer
const length = args.length;
const minGas = args[length - 1]

async function monitor() {
    try {
        const unixTime = Math.floor(Date.now() / 1000).toString();
        const halfHourFee = await getHalfHourFee(minGas);

        args.pop()
        args.push(halfHourFee.toString())

        console.log(args)
        const process = spawn('node', args);

        process.stdout.on('data', data => {
            writetoFile(unixTime, data);
            console.log(data.toString());
        });

        process.stderr.on('data', data => {
            console.error(`stderr: ${data}`);
        });

        process.on('close', code => {
            console.log(`child process exited with code ${code}`);
            monitor(); // Recursive call to continue the loop
        });

    } catch (error) {
        console.error('Error in monitor function:', error);
    }
}

function writetoFile(unixTime, logStr) {
    const writeStream = fs.createWriteStream(path.join(dirPath, `${unixTime}_log.txt`), { flags: 'a' });
    writeStream.write(logStr);
    writeStream.end();
}

monitor();