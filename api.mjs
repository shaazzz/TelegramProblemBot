import { config } from "./config.mjs"
import fetch from "node-fetch"

const url=`https://api.telegram.org/bot${config.token}/`;

export async function sendMessage(text, chat_id, reply_markup){
    if(reply_markup === undefined)
        reply_markup={remove_keyboard:true};
    else
        reply_markup={keyboard:reply_markup};
    await fetch( `${url}sendMessage`, {
        method : "POST",
        headers : { 'Content-Type': 'application/json' },   
        body : JSON.stringify( { chat_id, text ,reply_markup} )
    });
}
let lastOffset=0;
export function getUpdates(){
    return fetch(`${url}getUpdates`,{
        headers : { "Content-Type" : "application/json" },
        method : "POST",
        body : JSON.stringify( { offset : lastOffset+1 } )
    })
    .then(res=>res.json())
    .then(res => { 
        res= res.result;
        if(res.length > 0)
            lastOffset= res[ res.length -1 ].update_id;
        return res;
    });  
}