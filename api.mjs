import fetch from "node-fetch"
import telegram from "telegram-bot-api"
import fs from "fs"

var config = JSON.parse(fs.readFileSync("./config.json", "utf-8"));

var tele = new telegram({token: config.token});

const url = `https://api.telegram.org/bot${config.token}/`;

export async function sendMessage(text, chat_id, reply_markup) {
  if (reply_markup === undefined)
    reply_markup = {remove_keyboard: true};
  else
    reply_markup = {keyboard: reply_markup};
  await fetch(`${url}sendMessage`, {
    method: "POST",
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({chat_id, text, reply_markup})
  });
}

export async function sendPhoto(link, chat_id, reply_markup) {
  if (reply_markup === undefined)
    reply_markup = {remove_keyboard: true};
  else
    reply_markup = {keyboard: reply_markup};
  await fetch(`${url}sendPhoto`, {
    method: "POST",
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({chat_id, photo: link, reply_markup})
  });
}

export async function sendDocument(link, chat_id, reply_markup) {
  if (reply_markup === undefined)
    reply_markup = {remove_keyboard: true};
  else
    reply_markup = {keyboard: reply_markup};
  await fetch(`${url}sendDocument`, {
    method: "POST",
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({chat_id, document: link, reply_markup})
  });
}

let lastOffset = 0;

export function getUpdates() {
  return fetch(`${url}getUpdates`, {
    headers: {"Content-Type": "application/json"},
    method: "POST",
    body: JSON.stringify({offset: lastOffset + 1})
  })
    .then(res => res.json())
    .then(res => {
      res = res.result;
      if (res.length > 0)
        lastOffset = res[res.length - 1].update_id;
      return res;
    }).catch(err => {
      console.error(err);
    });
  /*    return tele.getUpdates( { offset : lastOffset+1 } ).then(res=>{
          if(res.length > 0)
              lastOffset= res[ res.length -1 ].update_id;
          return res;
      });*/
}

export async function sendBackup(chat_id) {
  let now = parseInt(fs.readFileSync(`./backup/users/now`, "utf-8"));
  await tele.sendDocument({chat_id, document: `./backup/users/${now}.json`});
  now = parseInt(fs.readFileSync(`./backup/problems/now`, "utf-8"));
  await tele.sendDocument({chat_id, document: `./backup/problems/${now}.json`});
}
