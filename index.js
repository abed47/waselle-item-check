const chalk = require('chalk');
const clear = require('clear');
const figlet = require('figlet');
const xlsx = require('xlsx');
const files = require('./lib/files');
const inquirer  = require('./lib/inquirer');
const CLI = require('clui');
let _colors = require('color-name')
const Spinner = CLI.Spinner;
const status = new Spinner('please wait...');
const cliProgress = require('cli-progress');
const progressBar = new cliProgress.SingleBar({
    format: '{msg} |' +'{bar}' + '| {percentage}% || {value}/{total} rows',
    barCompleteChar: '\u2588',
    barIncompleteChar: '\u2591',
    hideCursor: true
},cliProgress.Presets.shades_classic)
const path = require('path');
const fs = require('fs');
const directoryPath = (p) => {return path.join(__dirname, `${p}`)};
const gePath = (oldPath,newPath) => {return path.join(oldPath,newPath)}
let currentPath = '';
let currentOpt = '';
let selectedFilePath = '';
let obj1 = [];
let obj2 = [];
clear();

console.log(
  chalk.yellow(
    figlet.textSync('ReVision', { horizontalLayout: 'full' })
  )
);

const run = async () => {
    const credentials = await inquirer.init();
    currentOpt = credentials.operation;
    let p = directoryPath('.');
    currentPath = p;
    getInPath(p)
  };

run();

function getInPath(pathName){
    let s = [];
    fs.readdir(pathName,async function (err, files) {
        if (err) {
            return console.log('Unable to scan directory: ' + err);
        } 
        let chosen = await inquirer.propmptLocation(files)
        moveInPaths(chosen)
    });
}

function moveInPaths(location){
    if(location.operation === '..'){
        let p = gePath(currentPath,'..');
        currentPath = p;
        getInPath(p);
        return;
    }else if(location.operation === '.'){
        getInPath('.');
        return;
    }else if(
        location.operation.includes('.xlsx') ||
        location.operation.includes('.xlsm') ||
        location.operation.includes('.xltx') ||
        location.operation.includes('.xltm') ||
        location.operation.includes('.xls')){
            if(obj1.length !== 0 && currentOpt === 'compare'){
                let p = gePath(currentPath,location.operation)
                currentPath = p;
                runCompare(obj1,p)
                return
            }
            let p = gePath(currentPath,location.operation);
            currentPath = p;
            runOperation(p,currentOpt);
            return;
        }
    let p = gePath(currentPath,location.operation)
    currentPath = p;
    getInPath(p);
}

async function runOperation(filePath,opt){
    let wb = await xlsx.readFile(filePath).Sheets["Sheet1"]
    let objectArray = await xlsx.utils.sheet_to_json(wb);
    switch(opt){
        case 'compare':
        obj1 = objectArray;
        status.stop();
        getInPath('.')
            break;
        case 'fix fractions':
            runfixFractions(objectArray)
            break;
    }
}

async function runCompare(arr1,file2){
    let wb = await xlsx.readFile(file2).Sheets["Sheet1"]
    let objectArray = await xlsx.utils.sheet_to_json(wb);
    let defrances = [];
    progressBar.start(arr1.length,0,{msg:"COMPARING ROWS"})
    
    for(let i = 0; i < arr1.length; i++){
        for(let j = 0; j < objectArray.length; j++){
            if(arr1[i] && objectArray[j]){if(arr1[i]['Family:'] === objectArray[j]['Family:'] &&
                arr1[i]["Code"] !== objectArray[j]["Code"]
                ){
                    defrances.push(arr1[i])
                }}
        }
        progressBar.update(i)
    }
    let ws = xlsx.utils.json_to_sheet(defrances)
    let wbOut = new xlsx.utils.book_new()
    xlsx.utils.book_append_sheet(wbOut,ws);
    if(!fs.existsSync('./output')){
        console.log('passed ...........')
        fs.mkdir('./output',() => {})
    }
    xlsx.writeFile(wbOut,`./output/out.xlsx`)
    fs.writeFile(`./output/out.json`,JSON.stringify(defrances),() => {
    })
    progressBar.stop()
    console.log(chalk.green('Done!'))
}

function runfixFractions(data){
    progressBar.start(data.length,0,{msg: "READING ROWS"})
    for(let i = 0 ; i < data.length; i++){
        if(data[i]['Code']){
            if(Number(data[i]['Code']) % 1 !== 0){
                let num = data[i]['Code'];
                num = Number(num) + (Number(data[i]['Code']) / 100 * 15)
                data[i]['Code'] = Number.parseInt(num)
            }
        }
        progressBar.update(i)
    }
    if(!fs.existsSync('./output')){
        fs.mkdirSync('./output')
    }
    let ws = xlsx.utils.json_to_sheet(data);
    let wb = new xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(wb,ws)
    xlsx.writeFile(wb,'./output/converted.xlsx')
    progressBar.stop()
    console.log(chalk.green('Done!'))
}

function getToday(){
    let date = new Date();
    let today = `${date.getDay()}/${date.getMonth() +1}`
    return today;
}