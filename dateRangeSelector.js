const moment = require('moment');

/**
 * Code for managing date selections
 */

const dateUnitsSelector = $("#dateUnitsSelector")
const dateSliderSelector = $("#date-range-slider")

function updateDateUnits(select, state) {
    state.dateUnitsChanged = true
    
    if (select.value == 'Daily') {
        state.dateFormat = date => moment(date).format('YYYY-MM-DD');
    } else if (select.value == 'Weekly') {
        state.dateFormat = date =>  moment(date).format('YYYY-WW');
    }  
    else if (select.value === 'Monthly') {
        state.dateFormat = date => date.getFullYear() + "-" + (1 + date.getMonth()).toString().padStart(2, "0");
    } else if (select.value == 'Quarterly') {
        state.dateFormat = date => date.getFullYear() + "-Q" + (1 + Math.round((date.getMonth() + 1) / 4));
    } else if (select.value == 'Yearly') {
        state.dateFormat = date => "" + date.getFullYear()
    } else {
        throw "unrecognized:" + select.value;
    }
}

function dateInit(state) {
    dateUnitsSelector.get()[0].value = settings.value('dateUnits', 'Monthly')
    updateDateUnits(dateUnitsSelector.get()[0], state)
    dateUnitsSelector.on('change', function () {
        settings.setValue('dateUnits', this.value)
        updateDateUnits(this, state)
        update();
    });

    //slider from jquery-ui
    $(function () {
        dateSliderSelector.slider({
            range: true,
            min: 0,
            max: 0,
            step: 1,
            stop: () => {
                updateDateRangeSliderLabels(state)
                update()
            }
        });
    });

    $('#dateRangeFrom').change(function (e) {
        updateSliderFromInput(state)
    })
    $('#dateRangeTo').change(function (e) {
        updateSliderFromInput(state)
    })
}


function updateDateRangeSliderLabels(state) {
    const sliderValues = dateSliderSelector.slider("option", "values");
    $("#dateRangeFrom").val(state.intervals[sliderValues[0]])
    $("#dateRangeTo").val(state.intervals[sliderValues[1]])
}

function setDate(date, state) {
    $("#dateRangeFrom").val(date)
    $("#dateRangeTo").val(date)
    updateSliderFromInput(state)
}


function updateSliderFromInput(state) {
    const sliderValues = dateSliderSelector.slider("option", "values");
    let startIndex = state.intervals.indexOf($('#dateRangeFrom').get()[0].value)
    if (startIndex == -1) {
        startIndex = sliderValues[0]
    }
    let endIndex = state.intervals.indexOf($('#dateRangeTo').get()[0].value)
    if (endIndex === -1) {
        endIndex = sliderValues[1]
    }
    if (endIndex >= startIndex) {
        if (startIndex != sliderValues[0] ||
            endIndex != sliderValues[1]) {
            dateSliderSelector.slider("option", "values", [startIndex, endIndex]);
        }
        update()
    }
}

function dateUpdate(state) {
    let oldMax = dateSliderSelector.slider("option", "max");


    dateSliderSelector.slider({
        max: state.intervals.length - 1
    });

    let sliderValues = dateSliderSelector.slider("option", "values");

    if (sliderValues[0] > state.intervals.length ||
        sliderValues[1] >= state.intervals.length ||
        state.dateUnitsChanged ||
        //if we added new postings, and increased the date range
        //and we were previously at the max range,
        //extend the max range
        (!state.dateUnitsChanged && oldMax + 1 < state.intervals.length && sliderValues[1] == oldMax)) {
        dateSliderSelector.slider("option", "values", [0, state.intervals.length - 1]);
        sliderValues[0] = 0;
        sliderValues[1] = state.intervals.length - 1
    }
    state.dateUnitsChanged = false
    updateDateRangeSliderLabels(state)
    return sliderValues
}

module.exports = { dateInit, dateUpdate, setDate }