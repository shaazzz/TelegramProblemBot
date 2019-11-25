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
function update_problems(){// momkene be khatere refrence o ina in copy nakone vaghean?
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

export function listOfTags(){
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
    return problems[id];
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

// {name, adder, tag, dif, text, hint, soloution}

export function addProblem(p){
    let id=chooseId();
    problems[id]=p;
    update_tags();
    return id;
}
export function addNewProblem(p){
    newProblems[newProblems.length]=p;
}

export function printListP(arr){
    let str="";
    for(let x of arr)
        str= str + x+ " : " + problems[x].name + "\n";
    if(str === "")
        str="لیست خالی است!";
    return str;           
}

export function printProblem(p){
    return `آیدی سوال : ${p} \n اسم سوال : ${problems[p].name} \n ${problems[p].text}`;
}

load();
setInterval(save, 10 * 60 * 1000);
