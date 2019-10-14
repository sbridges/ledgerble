/**
 * Code for the currency selector
 */

function initCurrencies(update) {
    $("#currSelector").change(update)
}

function updateCurrencies(currencies) {
    const currSelected = $("#currSelector").val()
    let noChange = currencies.has(currSelected)

    currencies = Array.from(currencies)
    currencies.sort()

    $('#currSelector').children().remove()
    for (currency of currencies) {
        $('#currSelector')
            .append($("<option></option>")
                .attr("value", currency)
                .text(currency));
    }

    if (noChange) {
        $('#currSelector').val(currSelected)
        return currSelected
    }

    return $("#currSelector").val()


}




module.exports = { updateCurrencies, initCurrencies }