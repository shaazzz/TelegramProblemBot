import fs from "fs"

let dir="./backup";
let dir1=dir + "/problems";
let dir2=dir + "/users";
let now1=0, now2=0;

if(!fs.existsSync(dir)){
    fs.mkdirSync(dir);
}

if(!fs.existsSync(dir1)){
    fs.mkdirSync(dir1);
    fs.writeFileSync(`${dir1}/now`,0);
}
else{
    now1=fs.readFileSync(`${dir1}/now`, "utf-8");
}

if(!fs.existsSync(dir2)){
    fs.mkdirSync(dir2);
    fs.writeFileSync(`${dir2}/now`,0);
}
else{
    now2=fs.readFileSync(`${dir2}/now`, "utf-8");
}

let dat1=fs.readFileSync("./initProblems.json","utf-8");
let dat2=fs.readFileSync("./initUsers.json","utf-8");

fs.writeFileSync(`${dir1}/${now1}.json`,dat1);
fs.writeFileSync(`${dir2}/${now2}.json`,dat2);