import fs from "fs"

let dat= JSON.parse( fs.readFileSync("./data.json","utf-8") );
var problems=dat.problems;
var w={};

//console.log(dat.problems["پمپ بنزین"].tag);

function normalStr(s){
  var st=0, en=s.length-1;
  while(st<s.length && s[st] === ' ') st++;
  while(en>=0 && s[en] === ' ') en--;
  en++;
  return s.slice(st,en);
}

for(let prob in problems){
  let w={};
  for(let x in problems[prob].tag){
    w[normalStr(x)]=problems[prob].tag[x];
  }
  problems[prob].tag=w;
}
//console.log(dat.problems["پمپ بنزین"].tag);
fs.writeFileSync("./data.json",JSON.stringify(dat));

//console.log(problems);
/*
function save(){
  let dat={users,problems,newProblems};
  fs.writeFileSync("./data.json",JSON.stringify(dat));
}*/