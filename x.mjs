import fs from "fs"

let dat= JSON.parse( fs.readFileSync("./initProblems.json","utf-8") );
for(let x in dat.problems){
    dat.problems[x].like = 0;
    dat.problems[x].dislike = 0;
    dat.problems[x].text = {isText : true, text : dat.problems[x].text};
    dat.problems[x].hint = {isText : true, text : dat.problems[x].hint};
    dat.problems[x].soloution = {isText : true, text : dat.problems[x].soloution}; 
}
fs.writeFileSync(`./initProblems.json`,JSON.stringify(dat));

dat= JSON.parse( fs.readFileSync("./initUsers.json","utf-8") );
for(let x in dat.users){
    dat.users[x].state = "start";
}
fs.writeFileSync(`./initUsers.json`,JSON.stringify(dat));
