var imaps = require('imap-simple');
var MyQ = require('myq-api');
var account = new MyQ('YOUR_MYQ_EMAIL', 'YOUR_MYQ_PASSWORD');
var door_id = "YOUR_DOOR_ID";
var DELAY_TO_CLOSE = 30000;
var MYQ_OPEN_MESSAGE = 'myQ Alert: Garage Door Opener just opened';

var config = {
    imap: {
          user: 'YOUR_MYQ_EMAIL',
          password: 'YOUR_EMAIL_PASSWORD',
          host: 'imap.mail.yahoo.com',
        port: 993,
        tls: true,
        authTimeout: 3000
    },
    onmail: onmail
};

var connection_global;
loop()

function loop(){
    imaps.connect(config).then(function (connection) {

        connection.openBox('INBOX').then(function () {
            connection_global = connection
            console.log("connected: " + new Date())
        })
    });
}

function onmail(numNewMail){
    if (!connection_global)
            return
    var delay = 24 * 3600 * 1000;
    var yesterday = new Date();
    yesterday.setTime(Date.now() - delay);
    yesterday = yesterday.toISOString();
    var searchCriteria = [['SINCE', yesterday],['HEADER','SUBJECT', MYQ_OPEN_MESSAGE]];
    var fetchOptions = { bodies: ['HEADER.FIELDS (FROM TO SUBJECT DATE)'], struct: true };
    // retrieve only the headers of the messages
    var ms = 0
    connection_global.search(searchCriteria, fetchOptions).then(function (messages) {
        messages.forEach(function (message) {
            var date = new Date(message.parts[0].body.date[0])
            ms = Math.max(date.getTime(), ms)
        })
        var now = new Date().getTime()
        var diff = (now - ms)/1000
        if (diff < 120){
            console.log("timer started")
            setTimeout(tryClose, DELAY_TO_CLOSE);
        }
    });
}

async function tryClose() {
    var success = await account.login();
    console.log("tryna close now");
    account.getDoorState(door_id).then(function (result) {
        if (result.doorState == 1) {
            account.setDoorState(door_id, 0)
        }
    })
 }