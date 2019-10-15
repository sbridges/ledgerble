/**
 * options settings
 */


const settings = require("settings-store")


function initSettings() {
    let cmd = settings.value("options.ledger.command", 'ledger')
    let hledger = settings.value("options.hledger", false)

    $('#ledgerCommand').val(cmd)
    $('#ledgerCommand').change(() => {
        saveLedgerCommand()
    })

    $('#hLedger').prop('checked', hledger)
    $('#hLedger').change(() => {
        saveHLedger()
    })

    

    $('#browseCommandButton').click(() => {
        document.getElementById('selectLedgerCommand').click();
    })

    $('#selectLedgerCommand').change(() => {
        $('#ledgerCommand').val(document.getElementById('selectLedgerCommand').files[0].path)
        saveLedgerCommand()
    })

}

function saveLedgerCommand() {
    settings.setValue("options.ledger.command", getLedgerCommand())
}

function saveHLedger() {
    console.log(getHLedger())
    settings.setValue("options.hledger", getHLedger())
}

function getLedgerCommand() {
    return $('#ledgerCommand').val()
}

function getHLedger() {
    return $('#hLedger').is(":checked")
}

module.exports = { initSettings, getLedgerCommand, getHLedger }