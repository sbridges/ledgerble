/**
 * Code for updating income/expenses graph
 */


const Stream = require('streamjs');

function getSums(dateToPostings, keys, type, flip) {
    const answer = [];
    for (key of keys) {
        let sum = 0;
        if (dateToPostings[key]) {
            for (p of dateToPostings[key]) {
                if (p.type === type) {
                    sum += p.amount
                }
            }
        }
        if (flip) {
            answer.push(0 - sum)
        } else {
            answer.push(sum)
        }
    }
    return answer
}


function formatToolTip(params, formatter) {
    let answer = "<table>"
    for (p of params) {
        answer = answer + "<tr><td>" + p.seriesName + "</td><td align='right'>" + formatter(p.data) + "</td></tr>"
    }
    return answer
}


let icTable;

function updateIncomeExpenses(myChart, postings, dateFormat, dateIntervals, formatter, setDateTo,
    incomeExpensesTable) {

    //object map of yyyy-mm to ArrayPostings
    const dateToPostings = Stream(postings)
        .groupBy(t => dateFormat(t.date));

    const expenses = getSums(dateToPostings, dateIntervals, 'expenses', true)
    const income = getSums(dateToPostings, dateIntervals, 'income', true)
    net = []
    for (i = 0; i < expenses.length; i++) {
        net.push(income[i] + expenses[i])
    }

    myChart.setOption(option = {
        tooltip: {
            trigger: 'axis',
            axisPointer: {
                type: 'cross',
                crossStyle: {
                    color: '#999'
                }
            },
            formatter: params => formatToolTip(params, formatter)
        },

        legend: {
            data: ['Expenses', 'Income', 'Net']
        },
        xAxis: [
            {
                type: 'category',
                data: dateIntervals,
                axisPointer: {
                    type: 'shadow'
                }
            }
        ],
        yAxis: [
            {
                type: 'value',
                name: '',
                axisLabel: {
                    formatter: value => formatter(value)
                }
            }
        ],
        series: [

            {
                name: 'Income',
                type: 'bar',
                stack: 'one',
                color: 'rgba(75, 192, 192, 0.5)',
                data: income,
            },
            {
                name: 'Expenses',
                type: 'bar',
                stack: 'one',
                color: 'rgba(255, 99, 132, 0.5)',
                data: expenses
            },
            {
                name: 'Net',
                type: 'line',
                color: 'rgb(54, 162, 235, 0.9)',
                data: net,
            }
        ]
    });

    myChart.on('click', function (params) {
        setDateTo(params.name)
    });

    const rows = []
    rows.push(stats('Income', income, formatter))
    rows.push(stats('Expenses', expenses.map(x => -x), formatter))
    rows.push(stats('Net', net, formatter))

    if (icTable) {
        icTable.destroy();
    }



    icTable = $(incomeExpensesTable).DataTable({
        data: rows,
        deferRender: true,
        paging: false,
        searching: false,
        ordering: false,
        bInfo: false,
        'columnDefs': [
            {
                "targets": 0,
                "className": "bold-cell",
            },
            {
                "targets": 1,
                "className": "text-right",
            },
            {
                "targets": 2,
                "className": "text-right",
            },
            {
                "targets": 3,
                "className": "text-right",
            },
            {
                "targets": 3,
                "className": "text-right",
            }
        ]
    });
}


function stats(name, vals, formatter) {
    let sum;
    let max;
    let min;
    let avg;
    if (vals.length == 0) {
        sum = 0;
        max = 0;
        min = 0;
        avg = 0;
    } else {
        sum = vals.reduce((x, y) => x + y)
        max = vals.reduce((x, y) => Math.max(x, y))
        min = vals.reduce((x, y) => Math.min(x, y))
        avg = sum / vals.length
    }
    return [
        name,
        formatter(avg),
        formatter(max),
        formatter(min),
        formatter(sum)

    ]



}

function td(val, formatter) {
    if (val) {
        return `<td>${formatter(val)}</td>`
    } else {
        return `<td></td>`
    }

}


module.exports = updateIncomeExpenses