import { getUpdates } from "./api.mjs"
import { handleMessage } from "./logic.mjs"

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
        }
    }
}
main();

const chatMe=178926524; // to be erased
