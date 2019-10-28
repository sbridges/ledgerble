const { app, BrowserWindow, ipcMain } = require('electron')
const fs = require('fs')
const { execSync } = require('child_process');
const papaparse = require('papaparse')
const moment = require('moment');
const {parseHLedgerVal} = require('./hledger')

class Posting {
  constructor(date, accounts, amount, currency, merchant, type) {
    this.date = date;
    this.accounts = accounts; //array[String]
    this.amount = amount;     //Number
    this.currency = currency; //String
    this.merchant = merchant
    this.type = type
  }
}

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let win

function createWindow() {
  // Create the browser window.
  win = new BrowserWindow({
    width: 1500,
    height: 1150,
    webPreferences: {
      nodeIntegration: true
    }
  })

  // and load the index.html of the app.
  win.loadFile('index.html')
  //win.webContents.openDevTools()

  // Emitted when the window is closed.
  win.on('closed', () => {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    win = null
  })
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow)

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (win === null) {
    createWindow()
  }
})

//https://github.com/electron/electron/issues/10451
//not supported on all os's
if(app.setAboutPanelOptions) {
  app.setAboutPanelOptions({
    applicationName: "Ledgerble",
    version: "0.1",
    copyright: "Sean Bridges"
  });
}


ipcMain.on("parse", function (event, command, hledger, file) {
  parse(event, command, hledger, file);
});


function parse(event, command, hledger, file) {

  try {
    let postings;
    if (hledger) {
      postings = parseHLedger(command, file)
    } else {
      postings = parseLedger(command, file)
    }
    event.reply(
      'parsed',
      file,
      postings,
      null);
  } catch (t) {
    console.log('couldnt parse', file, t)
    event.reply(
      'parsed',
      file,
      null,
      "error:" + t);
  }
}

function parseLedger(command, file) {

  out = execSync('"' + command + '" -f "' + file + '" csv --no-pager --no-color', { encoding: 'utf-8', maxBuffer: 100 * 1024 * 1024 })
  res = papaparse.parse(out, {
    delimiter: ',',
    header: false,
    escapeChar: '\\',
  })

  if (res.errors.length > 0) {
    throw res.errors[0].message
  }
  let postings = []
  for (r of res.data) {
    if (r.length != 1) {
      postings.push(
        new Posting(
          new Date(moment(r[0], "YYYY/MM/DD").format()),
          r[3].split(":"),
          parseFloat(r[5]),
          r[4] === '' ? "??" : r[4],
          r[2]
        )
      )
    }
  }
  
  return postings;

 


}

function parseHLedger(command, file) {

  out = execSync('"' + command + '" -f "' + file + '" register -O csv', { encoding: 'utf-8', maxBuffer: 100 * 1024 * 1024 })
  res = papaparse.parse(out, {
    delimiter: ',',
    header: true,
    escapeChar: '"',
    skipEmptyLines : true
  })

  if (res.errors.length > 0) {
    throw res.errors[0].message
  }
  let postings = []
  for (r of res.data) {
    if (r.length != 1) {
      let valAndCurr = r['amount']
      //a hack
      //assume we are formated with the currency at the start
      //or the end, with the value in the middle
      //parse the non numeric bits out first
      //from the end and start, then trim and combine
      //them to get the currency
      let match = valAndCurr.match(/([^0-9.,-]*)([0-9.,-]+)([^0-9.,-]*)/)
      if(!match) {
        console.log(valAndCurr)
      }

      let currVal = parseHLedgerVal(match[2])
      
      curr = match[1].trim() + match[3].trim()
      if(curr === '') {
        curr = '??'
      }

      postings.push(
        new Posting(
          new Date(moment(r['date'], "YYYY/MM/DD").format()),
          r['account'].split(":"),
          currVal,
          curr,
          r['description']
        )
      )
    }

    
  }
  
  return postings

}