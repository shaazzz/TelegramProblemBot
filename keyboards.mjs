import {emojiArr} from "./dataHandle.mjs"

export const keyboards = {
    preStart:             undefined,
    tellName:             undefined,
    start:                [["سوال بده","سوال بگیر"],["میز کار ادمین"]],
    nameOrTag:            [["انتخاب تگ","انتخاب اسم"],["لیست سوالات"],["لیست سوالاتی که زور زدم روشون"],["رنکینگ"],["برگرد اول کار"]],
    chooseName:           [["برگرد اول کار"]],
    chooseTag:            [["هر تگی"],["برگرد اول کار"]],
    chooseDif:            [["آسون","متوسط","سخت"],["سختی برام مهم نیست"],["برگرد اول کار"]],
    chosenTagDif:         [["یک سوال جدید"],["لیست کل سوالات","لیست سوالات جدید"],["لیست سوالاتی که زور زدم روشون"],["برگرد اول کار"]],
    givenProblem:         [["سختی رو بگو","تگ ها رو بگو","هینت بده"],["حلش رو بگو","حلش کردم!"],["بیخیال بعدا حل میکنم"], emojiArr, ["وضعیت لایک های سوال"],["برگرد اول کار"]],
    checkPass:            [["برگرد اول کار"]],
    nowAdmin:             [["پاک کردن سوال","تایید سوال"],["حذف ادمین","لیست کاربران","لیست ادمین ها"],["پیام به همه"],["ذخیره کردن اطلاعات"],["ذخیره سازی و ارسال اطلاعات"],["برگرد اول کار"]],
    confirmProblem:       [["بله","خیر"],["برگرد اول کار"]],
    reasonForRej:         [["برگرد اول کار"]],
    sendToAll:            [["برگرد اول کار"]],
    addName:              [["برگرد اول کار"]],
    addTag:               [["برگرد اول کار"]],        
    addDif:               [["آسون","متوسط","سخت"],["برگرد اول کار"]],
    addStatement:         [["برگرد اول کار"]],
    addHint:              [["برگرد اول کار"]],
    addSoloution:         [["برگرد اول کار"]],
    removeName:           [["برگرد اول کار"]],
    removeAdmin:          [["برگرد اول کار"]]
}
