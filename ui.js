/**
 * UI code
 */

const ipc = require('electron').ipcRenderer;
const Stream = require('streamjs');

const updateIncomeExpenses = require('./incomeExpenses')
const echarts = require('echarts');
//https://stackoverflow.com/questions/51369979/bootstrap-uncaught-typeerror-cannot-read-property-fn-of-undefined 
//https://github.com/understrap/understrap/issues/449 
window.$ = window.jQuery = require('jquery');
window.Bootstrap = require('bootstrap');
require('./vendor/jquery-ui/1.12.1/jquery-ui')
require("./vendor/echarts/macaron.js")
const settings = require("settings-store")
const { dateInit, dateUpdate, setDate } = require('./dateRangeSelector')
const { filesInit, alertCantparse, reloadFiles } = require('./files')
const updateAssets = require('./assets')
const updateBalance = require('./balance')
var bs = require("binary-search");
const numeral = require('numeral')

const { updatePostings } = require('./postings')
const { updateCurrencies, initCurrencies } = require('./currency')

const CurrencyFormatter = require('currencyformatter.js')
const currencyToSymbolMap = require('currency-symbol-map/map')
const { initSettings, getSetting } = require('./options')
const setupToggle = require('./toggle')
const updateTreeMap = require('./treeMap')
//showModal isn't used explicitly, but its called from
//an href so it must be included here
const { showModal } = require('./treeTable')

require('datatables.net-dt')();
require('datatables.net-buttons-dt')();
require('datatables.net-buttons/js/buttons.colVis.js')();
require('datatables.net-colreorder-dt')();
require('datatables.net-fixedheader-dt')();
require('datatables.net-responsive-dt')();
require('datatables.net-scroller-dt')();

//state of a single file
//either parsed and a list of Postings,
//or an error
class FileState {
    constructor(error, postings) {
        this.error = error;
        this.postings = postings;
    }
}

function escapeHtml(unsafe) {
    return echarts.format.encodeHTML(unsafe)
}


//state of the app
class State {
    constructor() {
        this.files = new Map() //maps string->FileState
    }
}


//Initializing is optional when using Electron
settings.init({
    appName: "Ledgerble", //required,
    publisherName: "sgb", //optional
    reverseDNS: "com.github.sbridges" //required for macOS
})

$('#cantParseAlert').hide()

const state = new State();
dateInit(state)

setupToggle(
    document.getElementById('expensesDisplayGraph'),
    document.getElementById('expensesDisplayTree'),
    document.getElementById('expensesTreeMap'),
    document.getElementById('expensesTable')
)
setupToggle(
    document.getElementById('incomeDisplayGraph'),
    document.getElementById('incomeDisplayTree'),
    document.getElementById('incomeTreeMap'),
    document.getElementById('incomeTable')
)


function accountsFmtd() {
    return this.accounts.join(':')
}

function dateFmtd() {
    return this.date.getFullYear() + '/' + (1 + this.date.getMonth()) + '/' + this.date.getDate()
}

let typeExtractor = null;

function updateTypeExtractor() {
    typeExtractor = accountString => {
        if(accountString.toLowerCase().match(new RegExp(getSetting('options.expenses.regex')))) {
          return 'expenses'
        }
        if(accountString.toLowerCase().match(new RegExp(getSetting('options.income.regex')))) {
          return 'income'
        }
        if(accountString.toLowerCase().match(new RegExp(getSetting('options.assets.regex')))) {
          return 'assets'
        }
        if(accountString.toLowerCase().match(new RegExp(getSetting('options.liabilities.regex')))) {
          return 'liabilities'
        }
        if(accountString.toLowerCase().match(new RegExp(getSetting('options.equity.regex')))) {
          return 'equity'
        }
        return 'unknown'
    }
}
initSettings(() => {
    updateTypeExtractor()
    reloadFiles()
})
updateTypeExtractor()

ipc.on('parsed', function (event, file, postings, error) {
    if (error) {
        alertCantparse(file, error)
    }
    else if (postings) {
        //serialized as json strings, restore to a date
        postings.forEach(t => {
            t.date = new Date(t.date)
            t.accountsFmtd = accountsFmtd
            t.dateFmtd = dateFmtd,
            t.type = typeExtractor(t.accounts.join(':'))
        })
    }

    state.files.set(file, new FileState(error, postings))
    update();
});

charts = [];
const expensesTreeMap = echarts.init(document.getElementById('expensesTreeMap'), 'macarons')
charts.push(expensesTreeMap)
const incomeTreeMap = echarts.init(document.getElementById('incomeTreeMap'), 'macarons')
charts.push(incomeTreeMap)
const incomeExpenses = echarts.init(document.getElementById('incomeExpenses'), 'macarons')
charts.push(incomeExpenses)
const assetsChart = echarts.init(document.getElementById('assetsChart'), 'macarons')
charts.push(assetsChart)

//https://stackoverflow.com/questions/30468111/bootstrap-shown-bs-tab-event-not-working
//update the graphs when tab changes
$('a[data-toggle="tab"]').on('shown.bs.tab', function (e) {
    update();
})

$('document').ready(() => filesInit());


initCurrencies(update)


function update() {

    state.postingsBeforeCurrencySelected = Stream(state.files.values())
        .filter(t => t) //Stream gives an extra undefined for some reason
        .filter(t => !t.error)
        .flatMap(t => t.postings)
        .toList()

    let currencies = new Set()
    for (p of state.postingsBeforeCurrencySelected) {
        currencies.add(p.currency)
    }

    currentCurrency = updateCurrencies(currencies)




    createValueFormatter(currentCurrency);

    state.rawPostings = state.postingsBeforeCurrencySelected.filter(t => t.currency === currentCurrency)

    let dates = []
    for (p of state.rawPostings) {
            dates.push(p.date)
    }

    dates.sort((a, b) => {
        return a.getTime() - b.getTime()
    })

    state.intervals = []
    if (dates.length > 0) {

        let endStr = state.dateFormat(dates[dates.length - 1])
        let current = new Date(dates[0].getTime())
        let currStr = state.dateFormat(current)
        state.intervals.push(currStr)
        while (currStr < endStr) {
            current.setDate(current.getDate() + 1)
            let newCurrStr = state.dateFormat(current)
            if (newCurrStr !== currStr) {
                state.intervals.push(newCurrStr)
                currStr = newCurrStr
            }

        }
        if (endStr !== currStr) {
            state.intervals.push(endStr)
        }
    }

    state.balances = calculateBalances(state.rawPostings,
        state.intervals,
        state.dateFormat)

    const sliderValues = dateUpdate(state)

    dateFilter = p => {
        formattedDate = state.dateFormat(p.date)
        return formattedDate >= state.intervals[sliderValues[0]] &&
            formattedDate <= state.intervals[sliderValues[1]]
    }
    state.postings = []
    for (p of state.rawPostings) {
        if (dateFilter(p)) {
            state.postings.push(p)
        }
    }


    const expensesPostings = Stream(state.postings)
        .filter(t => t.type === 'expenses')
        .toList();
    updateTreeMap(expensesTreeMap, document.getElementById('expensesTable'), expensesPostings, false, state.formatter);

    const incomePostings = Stream(state.postings)
        .filter(t => t.type === 'income')
        .toList();
    updateTreeMap(incomeTreeMap, document.getElementById('incomeTable'), incomePostings, true, state.formatter);

    updateIncomeExpenses(
        incomeExpenses,
        state.postings,
        state.dateFormat,
        state.intervals.slice(sliderValues[0], sliderValues[1] + 1),
        state.formatter,
        date => {
            setDate(date, state)
        },
        document.getElementById('incomeExpensesTable'))
    for (chart of charts) {
        chart.resize();
    }

    updateBalance($("#balanceTable").get()[0], state.balances, sliderValues[1], state.formatter)
    updateAssets(assetsChart, state.balances, state.intervals, sliderValues[0], sliderValues[1], state.formatter)
    updatePostings(state.postings, state.formatter, $('#postingsTable'), true);
}

function createValueFormatter(currentCurrency) {

    //try to format the currency correclty
    //look up the currency code form the currency, that
    //translates $ to USD
    //then use the default formatter for that currency
    //test the formatter to see if it works, if it doesn't
    //fall back to something simple


    let currencyCode = currentCurrency;
    if (currencyCode === '$') {
        currencyCode = "USD"
    }

    for (let [key, value] of Object.entries(currencyToSymbolMap)) {
        if (value === currencyCode) {

            currencyCode = key;
        }
    }

    state.formatter = val => CurrencyFormatter.format(val, { currency: currencyCode });
    try {
        state.formatter(1);
    }
    catch (err) {
        //that didn't work, fall back
        state.formatter = value => numeral(value).format('0,0.00') + " " + currentCurrency;
    }
}

class BalanceKey {
    constructor(account, type) {
        this.account = account;
        this.type = type;
    }

    toString() {
        return this.account + '<****>' + this.type;
    }
}

function calculateBalances(rawPostings, intervals, dateFormat) {

    let keys = new Map()

    //map of account to an array of values for each
    //interval which represent the total for that
    //account at that time

    
    const amountsBucketed = new Map()
    for (p of rawPostings) {

        let key = new BalanceKey(p.accounts.join(':'), p.type)
        //in javascripts it
        //seems object have to be the same
        //to be equal
        //uniquify them
        if(keys.has(key.toString())) {
            key = keys.get(key.toString())
        } else {
            keys.set(key.toString(), key)
        }
        let amounts;
        if (amountsBucketed.has(key)) {
            
            amounts = amountsBucketed.get(key)
        } else {
            amounts = Array.from(intervals, _ => 0)
            amountsBucketed.set(key, amounts)
        }

        const date = dateFormat(p.date)
        let index = bs(intervals, date, (x, y) => x.localeCompare(y))
        if (index < 0) {
            index = 0;
        }
        for (i = index; i < amounts.length; i++) {
            amounts[i] = amounts[i] + p.amount;
        }
    }
    return amountsBucketed
}

$(window).on('resize', function () {
    for (chart of charts) {
        chart.resize();
    }
});






