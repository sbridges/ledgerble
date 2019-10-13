/**
 * Code for updating tree maps
 */


const echarts = require('echarts');
const { makeTreeTable } = require('./treeTable')

function getLevelOption() {
    return [
        {
            itemStyle: {
                normal: {
                    borderColor: '#777',
                    borderWidth: 0,
                    gapWidth: 1
                }
            },
            upperLabel: {
                normal: {
                    show: false
                }
            }
        },
        {
            itemStyle: {
                normal: {
                    borderColor: '#555',
                    borderWidth: 5,
                    gapWidth: 1
                },
                emphasis: {
                    borderColor: '#ddd'
                }
            }
        },
        {
            colorSaturation: [0.35, 0.5],
            itemStyle: {
                normal: {
                    borderWidth: 5,
                    gapWidth: 1,
                    borderColorSaturation: 0.6
                }
            }
        }
    ];
}


function updateTreeMap(myChart, table, postings, flip, formatter) {
    details = new Map()
    //map each account, and its parents to 
    //the combined value
    //for example Expenses:Car:Gas -> 12 and Expenses:Car:Insurance -> 15
    //would create 4 entries, Expenses -> 27, Expenses:Car -> 27, Expenses:Car:Gas -> 12 and Expenses:Car:Insurance -> 15
    const accountToVal = new Map();
    for (p of postings) {
        let accountCombined = ''
        for (account of p.accounts) {
            if (accountCombined.length > 0) {
                accountCombined = accountCombined + ":" + account
            } else {
                accountCombined = account
            }

            let amount = p.amount
            if (flip) {
                amount = -amount
            }

            if (accountToVal.has(accountCombined)) {
                details.get(accountCombined).push(p)
                accountToVal.set(accountCombined, amount + accountToVal.get(accountCombined))
            } else {
                details.set(accountCombined, [p])
                accountToVal.set(accountCombined, amount)
            }
        }
    }

    const accountToValNoRoot = new Map(accountToVal)
    accountToValNoRoot.forEach((value, key) => {
        if (key.toUpperCase() === 'EXPENSES' || key.toUpperCase() === 'INCOME') {
            accountToValNoRoot.delete(key)
        }
    })

    makeTreeTable(
        accountToValNoRoot,
        table,
        formatter,
        false,
        details
    )

    //create a node for each item in the map
    const nodes = [];
    accountToVal.forEach((v, k) => {
        nodes.push({
            "value": v,
            "name": k.split(":").pop() + ' ' + formatter(accountToVal.get(k)),
            "path": k.replace(/\:/g, '/'),
            "children": []
        }
        );
    })
    nodes.sort((a, b) => a.path.localeCompare(b.path));

    //the top of the stack is the last node
    const stack = []
    for (node of nodes) {
        if (stack.length === 0) {
            stack.push(node)
        } else {
            while (!node.path.startsWith(stack[0].path)) {
                stack.shift()
            }
            stack[0].children.push(node)
            stack.unshift(node)
        }
    }

    let root = stack.pop()
    if (root === undefined) {
        root = {
            "value": 0,
            "name": "empty",
            "path": "emtpy",
            "children": []
        }
    }



    function formatNoValues(paths) {

        return paths.map(beforeLastSpace).join(':')
    }

    function beforeLastSpace(path) {
        let parts = path.split(' ')
        parts.pop()
        return parts.join(' ')
    }

    myChart.setOption(option = {

        title: {

        },

        tooltip: {
            formatter: function (info) {
                var value = info.value;
                var treePathInfo = info.treePathInfo;
                var treePath = [];

                for (var i = 1; i < treePathInfo.length; i++) {
                    treePath.push(treePathInfo[i].name);
                }

                return [
                    '<div class="tooltip-title">' + escapeHtml('Expenses:' + escapeHtml(formatNoValues(treePath))) + '</div>',
                    formatter(value),
                ].join('');
            }
        },

        series: [
            {
                name: root.path,
                roam: false,
                type: 'treemap',
                visibleMin: 300,
                label: {
                    show: true,
                    formatter: '{b}'
                },
                upperLabel: {
                    normal: {
                        show: true,
                        height: 15
                    }
                },
                itemStyle: {
                    normal: {
                        borderColor: '#fff'
                    }
                },
                levels: getLevelOption(),
                data: root.children
            }
        ]
    });
}


module.exports = updateTreeMap