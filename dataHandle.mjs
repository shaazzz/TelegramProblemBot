import fs from "fs"

var problems= {}, allNames={};
var newProblems= [];
var tags={};

const directory="./backup/problems";

function load(){
    let now=parseInt( fs.readFileSync(`${directory}/now`,"utf-8") );
    let dat= JSON.parse( fs.readFileSync(`${directory}/${now}.json`,"utf-8") );
    problems= dat.problems;
    newProblems= dat.newProblems;
    allNames= dat.allNames;
    update_tags();            
}
export function save(){
    let dat={problems, newProblems, allNames};
    let now=parseInt( fs.readFileSync(`${directory}/now`,"utf-8") );
    now=(now+1) % 200;
    fs.writeFileSync(`${directory}/${now}.json`,JSON.stringify(dat));
    fs.writeFileSync(`${directory}/now`,now);
}

function update_tags(){
    tags={};
    for(let x in problems){
        for(let y in problems[x].tag){
            if(tags[y] === undefined)
                tags[y]=0;
            tags[y]++;
        }
    }
}
function update_problems(){
    let nw={}, n=0;
    for(let x in problems){
        if(problems[x] !== undefined)
            nw[x]=problems[x];
    }
    problems=nw;
    nw=[];
    for(let x in newProblems){
        if(newProblems[x] !== undefined){
            nw[n]=newProblems[x];
            n++;
        }
    }
    newProblems=nw;
}
function chooseId(){
    while(true){
        let i=100 + Math.floor(Math.random() * 9900);
        if(allNames[i] === undefined){
            allNames[i] = true;
            return i;
        }
    }
}

function Deep(x){ ///////// in arraye ro tabil mikone be object. chekar konim?
    if(typeof(x) !== "object") return x;
    let ans={};
    for(let y in x){
        ans[y]=Deep(x[y]);        
    }
    return ans;
}

export function listOfTags(){ // nabayad deep bashe?
    return tags;
}
export function listOfProblems(tag,dif,checker){
    if(tag === undefined){
        tag={};
    }
    if(checker === undefined){
        checker = ()=>true;
    }
    let ans=[];
    for(let x in problems){
        let A=true, B=dif === undefined || problems[x].dif === dif;
        for(let y in tag){
            if(problems[x].tag[y] === undefined)
                A=false;
        }
        if(A && B && checker(x)){
            ans[ans.length]= x;
        }
    }
    return ans;
}
export function giveProblem(id){
    if(problems[id] === undefined) return undefined;
    return Deep(problems[id]);
}
export function anyNew(){
    return newProblems.length > 0;
}
export function giveNewProblem(){
    let ans;
    if(anyNew()){
        ans=newProblems[newProblems.length-1];
        newProblems[newProblems.length-1]=undefined;
        update_problems();
    }
    return ans;
}
export function eraseProblem(id){
    problems[id]= undefined;
    update_problems();
    update_tags();
}

// {name, adder, tag, dif, text, hint, soloution, emoji}
// {soloution / hint / text : {isText, text}}

export function addProblem(p){
    let id=chooseId();
    problems[id]=Deep(p);
    update_tags();
    return id;
}
export function addNewProblem(p){
    newProblems[newProblems.length]=Deep(p);
}

export function printListP(arr){
    let str="";
    for(let x of arr)
        str= str + x+ " : " + problems[x].name + "\n";
    if(str === "")
        str="لیست خالی است!";
    return str;           
}

export const emojiArr = ['🐔', '🐷', '🐑', '🐇'];

export function isEmoji(emoji){
    let is = false;
    for(let e of emojiArr){
        if(e === emoji)
            is = true;
    }
    return is;    
}
export function addEmoji(problemId, userId, emoji){
    if(problems[problemId].emoji === undefined){
        problems[problemId].emoji = {};
    }
    let obj = problems[problemId].emoji;
    if(obj[emoji] === undefined){
        obj[emoji] = {};
    }
    if(obj[emoji][userId] === true){
        obj[emoji][userId] = false;
    }
    else{
        obj[emoji][userId] = true;
    }

    if(obj[":+1:"][userId] === true && obj[":-1:"][userId] === true){
        if(emoji === ":+1:")
            obj[":-1:"][userId] = false;
        if(emoji === ":-1:")
            obj[":+1:"][userId] = false;
    }
    return "انجام شد."
}
function Count(obj){
    let ans = 0;
    for(let x in obj){
        if(obj[x] === true)
            ans++;
    }
    return ans;
}
export function askEmoji(problemId){
    if(problems[problemId].emoji === undefined){
        problems[problemId].emoji = {};
    }
    let obj = problems[problemId].emoji;
    let ans = "";
    for(let emoji of emojiArr){
        if(obj[emoji] === undefined)
            obj[emoji] = {};
        ans+= `${emoji} : ${Count(obj[emoji])} \n`;
    }
    return ans;
}

load();
setInterval(save, 10 * 60 * 1000);
