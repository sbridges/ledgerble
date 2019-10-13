/**
 * Code for updating assets chart
 */

function updateAssets(myChart, balances, intervals, startIndex, endIndex, formatter) {

    const dateIntervals = intervals.slice(startIndex, endIndex + 1)
    const amountsBucketed = new Map()
    const totals = Array.from(dateIntervals, x => 0)
    balances.forEach((values, accounts) => {
        if (!accounts.toUpperCase().startsWith('ASSETS') &&
            !accounts.toUpperCase().startsWith('LIABILITIES')) {
            return;
        }
        const valueSlice = values.slice(startIndex, endIndex + 1)
        amountsBucketed.set(
            accounts,
            valueSlice
        )
        for (i = 0; i < totals.length; i++) {
            totals[i] += valueSlice[i]
        }
    })

    const keys = Array.from(amountsBucketed.keys())
    keys.sort()
    const series = []

    const legend = Array.from(keys)
    legend.push('Total')

    for (k of keys) {
        series.push(
            {
                name: k,
                type: 'line',
                stack: k,
                //stack: 'stack',
                //areaStyle: {},
                data: amountsBucketed.get(k)
            },
        )
    }

    series.push(
        series.push(
            {
                name: 'Total',
                type: 'line',
                stack: k,
                data: totals
            },
        )
    )

    function formatToolTip(params, formatter) {
        return params.name + "<br>" + params.marker + escapeHtml(params.seriesName) + ' ' + formatter(params.data)
    }

    myChart.setOption(option = {
        title: {

        },
        tooltip: {
            //trigger: 'axis',
            axisPointer: {
                type: 'cross',
                crossStyle: {
                    color: '#999'
                }
            },
            formatter: params => formatToolTip(params, formatter)
        },
        legend: {
            data: legend
        },
        grid: {
            left: '3%',
            right: '4%',
            bottom: '3%',
            containLabel: true
        },
        xAxis: [
            {
                type: 'category',
                boundaryGap: false,
                data: dateIntervals
            }
        ],
        yAxis: [
            {
                type: 'value',
                axisLabel: {
                    formatter: value => formatter(value)
                }
            }
        ],
        series: series
    });

}

module.exports = updateAssets