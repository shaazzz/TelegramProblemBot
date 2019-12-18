import fs from "fs"
import { sendMessage , sendBackup } from "./api.mjs"
import { keyboards } from "./keyboards.mjs"
import { listOfTags, listOfProblems, giveProblem, anyNew, giveNewProblem, eraseProblem, addProblem, addNewProblem, save as save2, printListP, printProblem} from "./dataHandle.mjs"

var config= JSON.parse( fs.readFileSync("./config.json", "utf-8") );

var users= {};


const directory="./backup/users";

function load(){
    let now=parseInt( fs.readFileSync(`${directory}/now`,"utf-8") );
    let dat= JSON.parse( fs.readFileSync(`${directory}/${now}.json`,"utf-8") );
    users=dat.users;
}
function save(){
    let dat={users};
    let now=parseInt( fs.readFileSync(`${directory}/now`,"utf-8") );
    now=(now+1) % 200;
    fs.writeFileSync(`${directory}/${now}.json`,JSON.stringify(dat));
    fs.writeFileSync(`${directory}/now`,now);
}

function newUser(name,username){
    let ans={
        state:"preStart",
        isAdmin:false,
        name,
        username,
        solved: {},
        notSolved : {},
        lstGiven : {},
        lstGivenId : undefined,
        score : 0
    };
    return ans;
}

var send= async (text, id)=>{ 
    text+="\n";
    await sendMessage(text, id, keyboards[users[id].state]); 
};

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
        if(usr.state === "confirmProblem"){
            addNewProblem(usr.lstGiven);
        }
        usr.state="start";
        await send("حله!", msg.from.id);
    }
};

function newP(usr){
    return (x)=> usr.solved[x] !== true && usr.notSolved[x] !== true;
}
function tryP(usr){
    return (x)=> usr.solved[x] !== true && usr.notSolved[x] === true;
}
function totP(usr){
    return (x)=> true;
}
function realName(s){
    s=normalStr(s);
    let cnt=0;
    for(let x of s)
        cnt+= x === ' ';
    return cnt>0;
}

const states = {
    preStart:[
        {
            key : (s)=>true,
            func: async (msg)=>{
                let usr= users[msg.from.id];
                usr.state= "tellName"
                await send(`سلام!\nبه ربات تلگرام شااززز خوش آمدید. لطفا نام و نام خانوادگی خود را وارد کنید : `, msg.from.id);                
            }
        }
    ],
    tellName:[
        {
            key : (s)=>true,
            func: async (msg)=>{
                let usr= users[msg.from.id];
                let s=msg.text;
                if(realName(s) === false){
                    await send('نام و نام خانوادگی خود را وارد کنید!', msg.from.id);       
                    return;
                }
                usr.name = msg.text;
                usr.state= "start";
                let tip1="هر وقت بنویسید 'برگرد اول کار' بر می گرده به اینجا!";
                let tip2="برای حل کردن سوال 'سوال بده' و برای اضافه کردن سوال به آرشیو ما از 'سوال بگیر' استفاده کنید.";
                let tip3="در قسمت 'سوال بده' می توانید به دو روش سوال انتخاب کنید. یا از طریق 'انتخاب اسم' آیدی سوال را (که یک عدد انگلیسی است) می نویسید یا از طریق 'انتخاب تگ' با توجه به تگ و سختی سوالی به شما پیشنهاد می شود.";
                let tip4="اگر می خواهید سوال حل کنید و تگ خاصی مد نظرتان نیست می توانید به جای تگ سوال 'هر تگی' را بنویسید.";
                let tip5="وقتی با تگ و سختی سوال انتخاب می کنید سوال تکراری به شما داده نخواهد شد. در کل سوال غیرتکراری یا سوال جدید یعنی سوالی که در آن گزینه 'حلش کردم' یا 'حلش رو بگو' یا 'بیخیال بعدا حلش میکنم' انتخاب نشده باشد."
                let tip6="سوالاتی که در آن 'بیخیال بعدا حلش میکنم' را انتخاب کردید در قسمت 'لیست سوالاتی که زور زدم روشون' قابل دسترسی است!";
                let tip7="به کسی که بیشترین تعداد سوال را اضافه کند پیتزا تعلق می گیرد! می توانید از قسمت رنکینگ تعداد سوالات اضافه شده و رتبه خود و ۱۰ نفر برتر را ببینید.";
                await send(tip1, msg.from.id);
                await send(tip2, msg.from.id);
                await send(tip3, msg.from.id);
                await send(tip4, msg.from.id);
                await send(tip5, msg.from.id);
                await send(tip6, msg.from.id);               
                await send(tip7, msg.from.id); 
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
                await send("اسم سوال را وارد کنید : ", msg.from.id);
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
                await send("آیدی سوال را وارد کنید:", msg.from.id);
            }
        },
        {
            key : (s)=> s==="انتخاب تگ",
            func: async (msg)=>{
                let usr= users[msg.from.id];
                usr.state="chooseTag";
                await send("تگ های مورد نظر را در یک خط و پشت سر هم بنویسید و تنها با - از هم جدا کنید.در صورتیکه تنها یک تگ مورد نظر است از - استفاده نکنید!\nهمچنین می توانید از نوشتن 'هر تگی' برای گرفتن سوال بدون تگ استفاده کنید.\nمثال:\nاستقرا-اکسترمال-لانه کبوتری", msg.from.id);
                let str="لیست تگ های موجود:\n";
                for(let x in listOfTags()){
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
                await send( printListP( listOfProblems() ) , msg.from.id);
            }
        },
        {
            key : (s)=> s==="لیست سوالاتی که زور زدم روشون",
            func: async (msg)=>{
                let usr= users[msg.from.id];
                usr.state="nameOrTag";
                await send( printListP( listOfProblems( undefined, undefined, tryP(usr) ) ), msg.from.id );
            }
        },
        {
            key : (s)=> s==="رنکینگ",
            func: async (msg)=>{
                let usr= users[msg.from.id];
                let str = "";
                let champion={};
                for(let i=0;i<10;i++){
                    let bst=-1;
                    for(let x in users){
                        if(users[x].isAdmin === true)
                            continue;
                        if(champion[x] !== undefined)
                            continue;
                        if((bst === -1) || users[x].score > users[bst].score)
                            bst=x;
                    }
                    if(bst === -1)
                        break;
                    str+=`${users[bst].name} : ${users[bst].score} \n`;
                    champion[bst] = true;
                }
                let rank=1;
                for(let x in users){
                    if(users[x].isAdmin === true)
                        continue;
                    if(users[x].score > usr.score)
                        rank++;
                }
                await send(str, msg.from.id);
                await send(`شما تا حالا ${usr.score} تا سوال اضافه کرده اید و نفر ${rank} ام هستید!`, msg.from.id);
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
                if(giveProblem(txt) === undefined){
                    await send("سوال با چنین آیدی وجود نداره.\nمی تونی دوباره انتخاب کنی.", msg.from.id);
                }
                else{                    
                    usr.state="givenProblem";
                    let p=giveProblem(txt);
                    usr.lstGivenId=txt;
                    usr.lstGiven=p;
                    await send( printProblem(txt), msg.from.id);
                }
            }
        }
    ],
    chooseTag:[
        restart,
        {
            key : (s)=> {
                s=s.split('-');
                for(let i in s){
                    s[i]= normalStr(s[i]);
                }
                for(let x of s){
                    if(x === "هر تگی")
                        return true;
                    if(listOfTags()[x] === undefined) 
                        return false;
                }
                return true;
            },
            func: async (msg)=>{
                let usr= users[msg.from.id];                
                usr.lstGiven.tag={};

                let s= msg.text;
                s=s.split('-');
                for(let i in s){
                    s[i]= normalStr(s[i]);
                }
                for(let x of s){
                    if(x === "هر تگی"){
                        usr.lstGiven.tag={};
                        break;
                    }
                    usr.lstGiven.tag[x]=true;
                }
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
                let s=msg.text;
                usr.lstGiven.dif = undefined;
                if(s !== "سختی برام مهم نیست"){
                    usr.lstGiven.dif=s;
                }
                let arr=listOfProblems(usr.lstGiven.tag, usr.lstGiven.dif);
                if(arr.length === 0){
                    usr.state = "nameOrTag";
                    await send("هیچ سوالی با همه این مشخصات موجود نیست.", msg.from.id);
                }
                else{
                    usr.state = "chosenTagDif";
                    await send("حالا که تگ و سختی رو انتخاب کردی لیست کل سوالا رو می خوای یا لیست سوالای جدید یا فقط یک سوال جدید؟!", msg.from.id);
                }
            }
        }
    ],
    chosenTagDif:[
        restart,
        {
            key : (s)=> s === "یک سوال جدید",
            func : async (msg)=>{
                let usr= users[msg.from.id];

                let arr=listOfProblems(usr.lstGiven.tag, usr.lstGiven.dif, newP(usr));
                let n= arr.length;
                let p= arr[ Math.floor( Math.random() * n ) ];

                if(n==0){
                    await send("هیچ سوال جدیدی با همه این مشخصات موجود نیست.", msg.from.id);
                    return;
                }

                usr.state="givenProblem";         
                usr.lstGiven = giveProblem(p);
                usr.lstGivenId = p;
                await send( printProblem(p), msg.from.id);                 
            }
        },
        {
            key : (s)=> s === "لیست کل سوالات",
            func : async(msg)=>{
                let usr= users[msg.from.id];
                usr.state = "chosenTagDif";
                await send( printListP( listOfProblems(usr.lstGiven.tag, usr.lstGiven.dif, totP(usr)) ), msg.from.id );
            }
        },
        {
            key : (s)=> s === "لیست سوالات جدید",
            func : async(msg)=>{
                let usr= users[msg.from.id];
                usr.state = "chosenTagDif";
                await send( printListP( listOfProblems(usr.lstGiven.tag, usr.lstGiven.dif, newP(usr)) ), msg.from.id );
            }
        },
        {
            key : (s)=> s === "لیست سوالاتی که زور زدم روشون",
            func : async(msg)=>{
                let usr= users[msg.from.id];
                usr.state = "chosenTagDif";
                await send( printListP( listOfProblems(usr.lstGiven.tag, usr.lstGiven.dif, tryP(usr)) ), msg.from.id );
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
                await send(usr.lstGiven.hint, msg.from.id);
            }
        },
        {
            key : (s)=> s==="حلش رو بگو",
            func: async (msg)=>{
                let usr= users[msg.from.id];
                usr.state= "nameOrTag";
                usr.solved[ usr.lstGivenId ]= true;
                await send(usr.lstGiven.soloution, msg.from.id);
                await send("حیف شد سوزوندی این رو!حالا می تونی دوباره سوال انتخاب کنی.", msg.from.id);
            }
        },
        {
            key : (s)=> s==="تگ ها رو بگو",
            func: async (msg)=>{
                let usr= users[msg.from.id];
                usr.state= "givenProblem";
                let str="";
                for(let x in usr.lstGiven.tag)
                    str=str + x + " ";
                await send(str, msg.from.id);
            }
        },
        {
            key : (s)=> s==="سختی رو بگو",
            func: async (msg)=>{
                let usr= users[msg.from.id];
                usr.state= "givenProblem";
                await send(usr.lstGiven.dif, msg.from.id);
            }
        },
        {
            key : (s)=> s==="حلش کردم!",
            func: async (msg)=>{
                let usr= users[msg.from.id];
                usr.solved[ usr.lstGivenId ]= true;
                usr.state= "nameOrTag";
                await send(usr.lstGiven.soloution, msg.from.id);                
                await send("آورین آورین.\nمی تونی دوباره سوال انتخاب کنی!", msg.from.id);
            }
        },
        {
            key : (s)=> s==="بیخیال بعدا حل میکنم",
            func : async (msg)=>{
                let usr= users[msg.from.id];
                usr.state= "nameOrTag";
                usr.notSolved[ usr.lstGivenId ]= true;
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
                await send("آیدی سوال را وارد کنید:", msg.from.id);
            }
        },
        {            
            key : (s)=> s==="لیست کاربران",
            func: async(msg)=>{
                let usr= users[msg.from.id];
                usr.state="nowAdmin";
                let str="", rem = 0;
                for(let x in users){
                    str= str + users[x].name + "  @" + users[x].username + "\n";
                    rem++;
                    if(rem == 75){
                        await send(str, msg.from.id);
                        rem = 0;
                        str = "";
                    }
                }
                if(rem != 0){
                    await send(str, msg.from.id);
                }
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
                        str= str + users[x].name + "  @" + users[x].username + "\n";
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
                if(anyNew()){
                    usr.lstGiven= giveNewProblem();
                    let str="اسم سوال : " + usr.lstGiven.name + "\n";
                    str= str + "نویسنده سوال : " + users[ usr.lstGiven.adder ].name + " @" + users[ usr.lstGiven.adder ].username + "\n";
                    str= str + "سختی سوال : " + usr.lstGiven.dif + "\n";
                    str= str + "تگ های سوال : ";
                    for(let y in usr.lstGiven.tag)
                        str=str + y + " ";
                    str=str+"\n"+"\n";
                    str= str + "متن سوال : \n" + usr.lstGiven.text + "\n";
                    str= str + "هینت سوال : \n" + usr.lstGiven.hint + "\n";
                    str= str + "جواب سوال : \n" + usr.lstGiven.soloution + "\n";
                    await send(str, msg.from.id);
                    usr.state="confirmProblem";
                    await send("آیا این سوال را تایید می کنید؟!", msg.from.id);
                }
                else{
                    await send("سوالی برای تایید وجود ندارد.", msg.from.id);    
                }                
            }
        },
     /*   {            
            key : (s)=> s==="ادیت سوال",
            func: async(msg)=>{
                let usr= users[msg.from.id];
                usr.state="startEdit";
                await send("آیدی سوال را وارد کنید:", msg.from.id);
            }
        },*/
        {
            key : (s)=> s==="ذخیره کردن اطلاعات",
            func : async (msg)=>{
                save();
                save2();
                await send("انجام شد!", msg.from.id);
            }
        },
        {
            key : (s)=> s==="حذف ادمین",
            func : async (msg)=>{
                let usr=users[msg.from.id];
                usr.state="removeAdmin";
                await send("یوزر نیم ادمین مورد نظر را بدون @ وارد کنید : ", msg.from.id);
            }
        },
        {
            key : (s)=> s==="ذخیره سازی و ارسال اطلاعات",
            func : async (msg)=>{
                let usr=users[msg.from.id];
                save();
                save2();
                await sendBackup(msg.from.id);
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
                let id=addProblem(usr.lstGiven);
                users[ usr.lstGiven.adder ].score++;
                await sendToAdmins(`${usr.name} سوالی را تایید کرد!`);
                await send(`تایید شد.\nآیدی سوال : ${id}`, msg.from.id);
            }
        },
        {
            key : (s)=> s==="خیر",
            func : async (msg)=>{
                let usr= users[msg.from.id];
                usr.state="nowAdmin";
                await sendToAdmins(`${usr.name} سوالی را رد کرد!`);
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
                usr.lstGiven.name= txt;
                usr.state="addTag";
                await send("تگ های سوال را انتخاب کنید. تگ ها باید در یک خط و پشت سر هم باشند و با - جدا شوند. در صورتیکه تنها یک تگ دارید از - استفاده نکنید.\nمثال:\nاستقرا-اکسترمال-دوگونه شماری", msg.from.id);
                let str="لیست تگ های موجود:\n";
                for(let x in listOfTags())
                    str=str + `${x}\n`;
                str=str + "\n\n" + "البته اگر از تگ جدیدی استفاده کنید در لیست اضافه خواهد شد.\n";
                await send(str, msg.from.id);
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
                usr.lstGiven.tag={};
                let s=txt.split('-');
                for(let i in s){
                    s[i]= normalStr(s[i]);
                    usr.lstGiven.tag[s[i]]=true;
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
                usr.lstGiven.dif= msg.text;
                usr.state="addStatement";
                await send("صورت سوال را وارد کنید:", msg.from.id);
            }
        }
    ],
    addStatement:[
        restart,
        {
            key : (s)=> true,
            func: async(msg)=>{
                let usr= users[msg.from.id];
                usr.lstGiven.text= msg.text;
                usr.state="addHint";
                await send("هینت سوال را وارد کنید:", msg.from.id);
            }
        }
    ],
    addHint:[
        restart,
        {
            key : (s)=> true,
            func: async(msg)=>{
                let usr= users[msg.from.id];
                usr.lstGiven.hint= msg.text;
                usr.state="addSoloution";
                await send("حل سوال را وارد کنید:", msg.from.id);
            }
        }
    ],
    addSoloution:[
        restart,
        {
            key : (s)=> true,
            func: async(msg)=>{
                let usr= users[msg.from.id];
                usr.lstGiven.soloution= msg.text;
                usr.lstGiven.adder=msg.from.id;
                if(usr.isAdmin){
                    let id=addProblem(usr.lstGiven);
                    usr.state="nowAdmin";
                    usr.score++;
                    await send(`سوال با موفقیت اضافه شد.\nآیدی سوال : ${id}\n`, msg.from.id);
                }
                else{
                    addNewProblem(usr.lstGiven);        
                    sendToAdmins("سوال جدید برای تایید!");
                    usr.state="start";
                    await send("سوال شما بعد از تایید ادمین ها اضافه خواهد شد!", msg.from.id);
                }
            }
        }
    ],
    removeName:[
        restart,
        {
            key : (s)=> giveProblem(s) !== undefined,
            func: async(msg)=>{
                let usr= users[msg.from.id];
                usr.state="nowAdmin";
                eraseProblem(msg.text);
                await send("سوال حذف شد.", msg.from.id);
            }
        }
    ],
    removeAdmin:[
        restart,
        {
            key : (s)=> {
                for(let x in users){
                    if(users[x].isAdmin && users[x].username === s)
                        return true;
                }
                return false;
            },
            func: async(msg)=>{
                let usr= users[msg.from.id];
                usr.state="nowAdmin";
                for(let x in users){
                    if(users[x].isAdmin && users[x].username === msg.text){
                        users[x].isAdmin=false;
                        await send(`بدینویسله ${users[x].name} با یوزرنیم ${users[x].username} از ادمینی برکنار می شود!`, msg.from.id);
                        return;
                    }
                }                
            }
        }
    ],
    /*
    startEdit:[
        restart,
        {
            key : (s)=> giveProblem(s) !== undefined,
            func : async(msg)=>{
                let usr= users[msg.from.id];
                usr.lstGivenId = msg.text;
                usr.lstGiven = giveProblem(msg.text);
                usr.state="chooseEdit";
                await send("چه قسمتی از سوال نیاز به ادیت داره؟", msg.from.id);
            }
        }
    ],
    chooseEdit:[
        restart,
        {
            key : (s)=> s==="نام سوال"
            func : async(msg)=>{

            }
        },
        {
            key : (s)=> s===""
            func : async(msg)=>{

            }
        }
    ] */  
};

export async function sendToAdmins(str){
    for(let x in users){
        if(users[x].isAdmin)
            await send(str, x);
    }
}

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

load();
setInterval(save, 10 * 60 * 1000);