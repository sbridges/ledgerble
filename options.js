/**
 * options settings
 */


const settings = require("settings-store")


function initSettings() {
    val = settings.value("options.ledger.command", 'ledger')
    $('#ledgerCommand').val(val)
    $('#ledgerCommand').change(() => {
        saveLedgerCommand()
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

function getLedgerCommand() {
    return $('#ledgerCommand').val()
}

module.exports = { initSettings, getLedgerCommand }