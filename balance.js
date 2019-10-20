/**
 * Code for updating the balance table
 */

//http://ludo.cubicphuse.nl/jquery-treetable/
const { makeTreeTable } = require('./treeTable')

function updateBalance(node, balances, endIndex, formatter) {

    const amounts = new Map();
    balances.forEach((value, key) => {
        let currentAccount = ''
        let val = value[endIndex]
        if (val === 0) {
            return;
        }
        for (a of key.account.split(':')) {

            if (currentAccount == '') {
                currentAccount = a;
            } else {
                currentAccount = currentAccount + ':' + a
            }


            if (amounts.has(currentAccount)) {
                amounts.set(currentAccount, amounts.get(currentAccount) + val)
            } else {
                amounts.set(currentAccount, val)
            }

        }
    });

    makeTreeTable(amounts, node, formatter, true)



}



module.exports = updateBalance