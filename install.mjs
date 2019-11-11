import fs from "fs"

let dir="./backup";

if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir);
}

let dat=fs.readFileSync("./initdata.json","utf-8");

for(let i=0;i<200;i++){
    fs.writeFileSync(`./backup/data${i}.json`,dat);
}
fs.writeFileSync(`./backup/now`,0);