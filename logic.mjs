import fs from "fs"
import { sendMessage } from "./api.mjs"
import { keyboards } from "./keyboards.mjs"
import { config } from "./config.mjs"

var users= {};
// mapping ids to an object
var problems= {};
var newProblems= {};
// mapping id of problems to their text
var tags={};

function newUser(name,username){
    let ans={
        state:"preStart",
        isAdmin:false,
        name,
        username,
        solved: {},
        notSolved : {},
        lstTag:undefined,
        lstGiven:undefined
    };
    return ans;
}
function newProblem(){
    let ans={
        tag:{},
        dif:undefined,
        text:undefined,
        hint:undefined,
        soloution:undefined
    }
    return ans;
}

function load(){
    let now=parseInt( fs.readFileSync(`./backup/now`,"utf-8") );
    let dat= JSON.parse( fs.readFileSync(`./backup/data${now}.json`,"utf-8") );
    users= dat.users;
    problems= dat.problems;
    newProblems= dat.newProblems;
    update_tags();            
}
function save(){
    let dat={users,problems,newProblems};
    let now=parseInt( fs.readFileSync(`./backup/now`,"utf-8") );
    now=(now+1) % 200;
    fs.writeFileSync(`./backup/data${now}.json`,JSON.stringify(dat));
    fs.writeFileSync(`./backup/now`,now);
}
function update_tags(){
    tags={};
    for(let x in problems){
        if(problems[x] === undefined) continue;
        for(let y in problems[x].tag){
            if(tags[y] === undefined)
                tags[y]=1;
            else
                tags[y]++;
        }
    }
}

var send= async (text, id)=>{ await sendMessage(text, id, keyboards[users[id].state]); };


///////////////////////// nabayad esme soal ya har chiz dige bargard aval kar bashe!

function normalStr(s){
    var st=0, en=s.length-1;
    while(st<s.length && s[st] === ' ') st++;
    while(en>=0 && s[en] === ' ') en--;
    en++;
    return s.slice(st,en);
  }

const restart={
    key : (s)=> s === "برگرد اول کار",
    func: async (msg)=>{
        let usr= users[msg.from.id];
        if(usr.state === "addTag" || usr.state === "addDif" || usr.state === "addSSH"){
            newProblems[usr.lstGiven]= undefined;
        }
        usr.state="start";
        await send("حله!", msg.from.id);
    }
};
const states = {
    preStart:[
        {
            key : (s)=>true,
            func: async (msg)=>{
                let usr= users[msg.from.id];
                usr.state= "start";
                await send(`سلام ${usr.name}\nچه کمکی از دست من بر می آد؟`, msg.from.id);
                await send("اکثر مواقع اگر بنویسی 'برگرد اول کار' بر می گرده به اینجا!", msg.from.id);
            }
        }
    ],
    start:[
        {
            key : (s)=> s==="سوال بده",
            func: async (msg)=>{
                let usr= users[msg.from.id];
                usr.state= "nameOrTag";
                await send("سوال رو با توجه به تگ انتخاب می کنی یا با اسم؟", msg.from.id);
            }
        },
        {
            key : (s)=> s==="سوال بگیر",
            func: async(msg)=>{
                let usr= users[msg.from.id];
                usr.state="addName";
                await send("اسم سوال را وارد کنید.ترجیحا یک کلمه ای و کوتاه باشد.", msg.from.id);
            }
        },
        {            
            key : (s)=> s==="میز کار ادمین",
            func: async(msg)=>{
                let usr= users[msg.from.id];
                if(usr.isAdmin){
                    usr.state="nowAdmin";
                    send("برو بریم!", msg.from.id);
                }
                else{
                    usr.state="checkPass";
                    send("رمز ادمین را وارد کنید:", msg.from.id);
                }
            }
        },        
    ],
    nameOrTag:[
        restart,
        {
            key : (s)=> s==="انتخاب اسم",
            func: async (msg)=>{
                let usr= users[msg.from.id];
                usr.state="chooseName";
                await send("اسم سوال را وارد کنید:", msg.from.id);
            }
        },
        {
            key : (s)=> s==="انتخاب تگ",
            func: async (msg)=>{
                let usr= users[msg.from.id];
                usr.state="chooseTag";
                await send("تگ های مورد نظر را در یک خط و پشت سر هم بنویسید و تنها با - از هم جدا کنید.در صورتیکه تنها یک تگ مورد نظر است از - استفاده نکنید!\nمثال:\nاستقرا-اکسترمال-لانه کبوتری", msg.from.id);
                let str="لیست تگ های موجود:\n";
                for(let x in tags){
                    if(tags[x] === undefined) continue;
                    str=str + `${x}\n`;
                }
                str=str + `هر تگی\n`;
                await send(str, msg.from.id);
            }
        },
        {
            key : (s)=> s==="لیست سوالات",
            func: async (msg)=>{
                let usr= users[msg.from.id];
                usr.state="nameOrTag";
                let str="";
                for(let x in problems){
                    if(problems[x] !== undefined)
                        str= str + x + "\n";
                }
                await send(str, msg.from.id);
            }
        },
        {
            key : (s)=> s==="لیست سوالایی که زور زدم روشون",
            func: async (msg)=>{
                let usr= users[msg.from.id];
                usr.state="nameOrTag";
                let str="";
                for(let x in problems){
                    if(problems[x] !== undefined && usr.solved[x] !== true && usr.notSolved[x] === true)
                        str=str + x + "\n";
                }
                await send(str, msg.from.id);
            }
        }        
    ],
    chooseName:[
        restart,
        {
            key : (s)=> true,
            func: async (msg)=>{
                let usr= users[msg.from.id];
                let txt=msg.text;
                if(problems[txt] === undefined){
                    await send("اسم سوال اشتباه است.\nمی تونی دوباره انتخاب کنی.", msg.from.id);
                }
                else{                    
                    usr.state="givenProblem";
                    usr.lstGiven=txt;
                    await send(`اسم سوال: ${txt}\n${problems[txt].text}`, msg.from.id);
                }
            }
        }
    ],
    chooseTag:[
        restart,
        {
            key : (s)=>{
                s=s.split('-');
                for(let i in s){
                    s[i]= normalStr(s[i]);
                }
                for(let x of s){
                    if(x === "هر تگی")
                        return true;
                    if(tags[x] === undefined) 
                        return false;
                }
                return true;
            },
            func: async (msg)=>{
                let usr= users[msg.from.id];                
                let s= msg.text;
                usr.lstTag=s;   
                usr.state="chooseDif";
                await send("سختی سوال را انتخاب کنید:", msg.from.id);
            }
        }
    ],
    chooseDif:[
        restart,
        {
            key : (s)=> (s === "آسون" || s === "متوسط" || s === "سخت" || s === "سختی برام مهم نیست"),
            func: async (msg)=>{
                let usr= users[msg.from.id];
                let s=usr.lstTag.split('-');
                let anyTag=false;

                for(let i in s){
                    s[i]= normalStr(s[i]);
                }
                for(let x of s){
                    if(x === "هر تگی")
                        anyTag=true;
                }
                let checker= (id)=>{
                    if(usr.solved[id] === true || usr.notSolved[id] === true) return false;
                    if(anyTag) return true;
                    for(let x of s){
                        if(problems[id].tag[x] === undefined) return false;
                    }
                    return true;
                }
                for(let prob in problems){
                    if(problems[prob] === undefined) continue;
                    if(checker(prob) && (msg.text === "سختی برام مهم نیست" || problems[prob].dif === msg.text)){
                        usr.lstGiven=prob;
                        usr.state="givenProblem";
                        await send(`اسم سوال: ${prob}\n${problems[prob].text}`, msg.from.id);
                        return;
                    }
                }
                usr.state= "nameOrTag";
                await send("همه سوال هایی که همه این تگ ها رو دارن زدی!\nمی تونی از اول سوال انتخاب کنی.", msg.from.id);
            }
        }
    ],
    givenProblem:[
        restart,
        {
            key : (s)=> s==="هینت بده",
            func: async (msg)=>{
                let usr= users[msg.from.id];
                usr.state= "givenProblem";
                await send(problems[ usr.lstGiven ].hint, msg.from.id);
            }
        },
        {
            key : (s)=> s==="حلش رو بگو",
            func: async (msg)=>{
                let usr= users[msg.from.id];
                usr.state= "nameOrTag";
                usr.solved[ usr.lstGiven ]= true;
                await send(problems[ usr.lstGiven ].soloution, msg.from.id);
                await send("حیف شد سوزوندی این رو!حالا می تونی دوباره سوال انتخاب کنی.", msg.from.id);
            }
        },
        {
            key : (s)=> s==="تگ ها رو بگو",
            func: async (msg)=>{
                let usr= users[msg.from.id];
                usr.state= "givenProblem";
                let str="";
                for(let x in problems[usr.lstGiven].tag)
                    str=str + x + " ";
                await send(str, msg.from.id);
            }
        },
        {
            key : (s)=> s==="سختی رو بگو",
            func: async (msg)=>{
                let usr= users[msg.from.id];
                usr.state= "givenProblem";
                await send(problems[ usr.lstGiven ].dif, msg.from.id);
            }
        },
        {
            key : (s)=> s==="حلش کردم!",
            func: async (msg)=>{
                let usr= users[msg.from.id];
                usr.solved[ usr.lstGiven ]= true;
                usr.state= "nameOrTag";
                await send(problems[ usr.lstGiven ].soloution, msg.from.id);                
                await send("آورین آورین.\nمی تونی دوباره سوال انتخاب کنی!", msg.from.id);
            }
        },
        {
            key : (s)=> s==="بیخیال بعدا حل میکنم",
            func : async (msg)=>{
                let usr= users[msg.from.id];
                usr.state= "nameOrTag";
                if(usr.solved[ usr.lstGiven ] !== true)
                    usr.notSolved[ usr.lstGiven ]= true;
                await send("باشه! این سوال به لیست سوالاتی که روشون زور زدی اضافه میشه.", msg.from.id);
            }
        }
    ],
    checkPass:[
        restart,
        {            
            key : (s)=> true,
            func: async(msg)=>{
                if(msg.text !== config.adminPassword){                    
                    await send("اشتباه بود. دوباره تلاش کن!", msg.from.id);
                    return;
                }
                let usr= users[msg.from.id];
                usr.state="nowAdmin";
                usr.isAdmin= true;
                await send("شما ادمین شدید!", msg.from.id);
            }
        }
    ],
    nowAdmin:[
        restart,
        {            
            key : (s)=> s==="پاک کردن سوال",
            func: async(msg)=>{
                let usr= users[msg.from.id];
                usr.state="removeName";
                await send("اسم سوال را وارد کنید:", msg.from.id);
            }
        },
        {            
            key : (s)=> s==="لیست کاربران",
            func: async(msg)=>{
                let usr= users[msg.from.id];
                usr.state="nowAdmin";
                let str="";
                for(let x in users){
                    str= str + users[x].name + "\n";
                }
                await send(str, msg.from.id);
            }
        },
        {            
            key : (s)=> s==="لیست ادمین ها",
            func: async(msg)=>{
                let usr= users[msg.from.id];
                usr.state="nowAdmin";
                let str="";
                for(let x in users){
                    if(users[x].isAdmin)
                        str= str + users[x].name + "\n";
                }
                await send(str, msg.from.id);
            }
        },
        {            
            key : (s)=> s==="پیام به همه",
            func: async(msg)=>{
                let usr= users[msg.from.id];
                usr.state="sendToAll";
                await send("متن خود را بنویسید. توجه کنید که بعد از ارسال قابل تغییر نیست!", msg.from.id);
            }
        },
        {
            key : (s)=> s==="تایید سوال",
            func : async (msg)=>{
                let usr= users[msg.from.id];
                for(let x in newProblems){
                    if(newProblems[x] !== undefined){
                        usr.lstGiven= x;
                        let str="اسم سوال : " + x + "\n";
                        str= str + "سختی سوال : " + newProblems[x].dif + "\n";
                        str= str + "تگ های سوال : ";
                        for(let y in newProblems[x].tag)
                            str=str + y + " ";
                        str=str+"\n"+"\n";
                        str= str + "متن سوال : \n" + newProblems[x].text + "\n";
                        str= str + "هینت سوال : \n" + newProblems[x].hint + "\n";
                        str= str + "جواب سوال : \n" + newProblems[x].soloution + "\n";
                        await send(str, msg.from.id);
                        usr.state="confirmProblem";
                        await send("آیا این سوال را تایید می کنید؟!", msg.from.id);
                        return;
                    }
                }
                await send("سوالی برای تایید وجود ندارد.", msg.from.id);
            }
        },
        {
            key : (s)=> s==="ذخیره کردن اطلاعات",
            func : async (msg)=>{
                save();
                await send("انجام شد!", msg.from.id);
            }
        }
    ],
    confirmProblem:[
        restart,
        {
            key : (s)=> s==="بله",
            func : async (msg)=>{
                let usr= users[msg.from.id];
                usr.state="nowAdmin";
                problems[usr.lstGiven]= newProblems[usr.lstGiven];
                newProblems[usr.lstGiven]= undefined;
                update_tags();
                await send("تایید شد.", msg.from.id);
            }
        },
        {
            key : (s)=> s==="خیر",
            func : async (msg)=>{
                let usr= users[msg.from.id];
                usr.state="nowAdmin";
                newProblems[usr.lstGiven]= undefined;
                await send("رد شد.", msg.from.id);
            }
        }
    ],
    sendToAll:[
        restart,
        {
            key : (s)=> true,
            func: async(msg)=>{
                let usr= users[msg.from.id];
                usr.state="nowAdmin";
                let str="";
                for(let x in users){
                    await send(msg.text, x);
                }
                await send("با موفقیت ارسال شد.", msg.from.id);
            }
        },
    ],
    addName:[
        restart,
        {
            key : (s)=> true,
            func: async(msg)=>{
                let usr= users[msg.from.id];
                let txt= msg.text;
                if(problems[txt] === undefined && newProblems[txt] === undefined){
                    usr.lstGiven= txt;
                    newProblems[txt]= newProblem();
                    usr.state="addTag";
                    await send("تگ های سوال را انتخاب کنید. تگ ها باید در یک خط و پشت سر هم باشند و با - جدا شوند. در صورتیکه تنها یک تگ دارید از - استفاده نکنید.\nمثال:\nاستقرا-اکسترمال-دوگونه شماری", msg.from.id);
                    let str="لیست تگ های موجود:\n";
                    for(let x in tags){
                        if(tags[x] === undefined) continue;                    
                        str=str + `${x}\n`;
                    }
                    str=str + "\n" + "البته اگر از تگ جدیدی استفاده کنید در لیست اضافه خواهد شد.\n";
                    await send(str, msg.from.id);
                }
                else{
                    usr.state="addName";
                    await send("اسم قبلا استفاده شده است. دوباره انتخاب کنید.", msg.from.id);
                }
            }
        }
    ],
    addTag:[
        restart,
        {
            key : (s)=> true,
            func: async(msg)=>{
                let usr= users[msg.from.id];
                let txt= msg.text;
                usr.state="addDif";
                let s=txt.split('-');
                for(let i in s){
                    s[i]= normalStr(s[i]);
                }
                for(let tg of s){
                    newProblems[usr.lstGiven].tag[tg]= true;
                }
                await send("سختی سوال را انتخاب کنید.",  msg.from.id);                
            }
        }
    ],
    addDif:[
        restart,
        {
            key : (s)=> (s === "آسون" || s === "متوسط" || s === "سخت"),
            func: async(msg)=>{
                let usr= users[msg.from.id];
                newProblems[usr.lstGiven].dif= msg.text;
                usr.state="addSSH";
                await send("حالا صورت سوال سپس هینت سوال سپس حل سوال را بنویسید که با $ از هم جدا شده اند.همچنین در متن صورت سوال یا حل سوال یا هینت سوال نباید از $ استفاده کنید.\nمثال:\n2+2=?\n$\nبه شدت بدیهی هست فکر کن!\n$\n4", msg.from.id);
            }
        }
    ],
    addSSH:[// statement // soloution // hint
        restart,
        {
            key : (s)=>{
                let pos1=-1, pos2=-1, pos3=-1;
                for(let i=0;i<s.length;i++){
                    if(s[i] !== '$') continue;
                    if(pos1 === -1) pos1=i;
                    else if(pos2 === -1) pos2=i;
                    else pos3=i;
                }
                return ( pos1!=-1 && pos2!=-1 && pos3==-1 && pos1!=0 && pos1+1!=pos2 && pos2+1!=s.length );
            },
            func: async(msg)=>{
                let usr= users[msg.from.id];
                let txt= msg.text;
                let s=txt.split('$');
                newProblems[usr.lstGiven].text=s[0];
                newProblems[usr.lstGiven].hint=s[1];
                newProblems[usr.lstGiven].soloution=s[2];
                if(usr.isAdmin){
                    problems[usr.lstGiven]= newProblems[usr.lstGiven];
                    newProblems[usr.lstGiven]= undefined;
                    update_tags();
                    usr.state="nowAdmin";
                    await send("سوال با موفقیت اضافه شد.", msg.from.id);
                }
                else{
                    for(let x in users){
                        if(users[x].isAdmin)
                            await send("سوال جدید برای تایید!", x);
                    }
                    usr.state="start";
                    await send("سوال شما بعد از تایید ادمین ها اضافه خواهد شد!", msg.from.id);
                }
            }
        }
    ],
    removeName:[
        restart,
        {
            key : (s)=> problems[s] !==undefined,
            func: async(msg)=>{
                let usr= users[msg.from.id];
                usr.state="nowAdmin";
                let txt= msg.text;
                problems[txt]= undefined;
                update_tags();
                await send("سوال حذف شد.", msg.from.id);
            }
        }
    ]
};

export async function handleMessage(msg){
    let usr= users[ msg.from.id ];
    if(usr === undefined) 
        usr= users[ msg.from.id ]= newUser(msg.from.first_name, msg.from.username);
    for(let nxt of states[ usr.state ]){
        if(nxt.key(msg.text)){
            await nxt.func(msg);    
            return;
        }
    }
    await send("چی شده؟!",msg.from.id);
}

setInterval(save, 10 * 60 * 1000);//// baadan beshe har 1 daghighe
load();