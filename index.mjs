import { getUpdates } from "./api.mjs"
import { handleMessage, sendToAdmins } from "./logic.mjs"

async function search(){    
    let res= await getUpdates();
    for(let x of res){
        console.log(x.message);
        await handleMessage(x.message);
    }
}
async function main(){
    while(true){
        try{
            await search();
        }
        catch(e){
            console.log(e);
            sendToAdmins(e);///// ba tavajoh be inke string nist chi mishe?
        }
    }
}
main();

const chatMe=178926524; // to be erased
