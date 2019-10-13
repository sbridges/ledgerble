/**
 * Code for creating a tree table
 */

const treetable = require('./vendor/jquery-treetable/3.2.0/jquery.treetable')
const { updatePostings } = require('./postings')

const modalDetails = new Map()

function showModal(key) {
    updatePostings(modalDetails.get(key), state.formatter, $('#modalPostings'), false);



    $('#detailsModal').modal({
        show: true
    });

    return false;
}

function makeTreeTable(amounts, node, formatter, sortByName, details) {
    if (details) {
        details.forEach((value, key) => {
            modalDetails.set(key, value)
        })
    }
    const html = []
    html.push(`
    <table id=${node.id + 'tree'}>
    <thead>
        <tr>
            <th>Account</th>
            <th>Amount</th>
            ${details ? '<th>Postings<th>' : ''}
        </tr>
      </thead>`)

    const keys = Array.from(amounts.keys())
    if (sortByName) {
        keys.sort()
    } else {
        keys.sort((l, r) => {

            //sort by the amount of the paths
            //of the same length
            //eg expenses:home:rent 
            //and expenses:entertainment:movies
            //should order by the values of
            //expensse:home and expenses:entertainment
            //as those are the buckets each is in

            ls = l.split(':')
            lr = r.split(':')
            ls.length = Math.min(ls.length, lr.length)
            lr.length = Math.min(ls.length, lr.length)

            return amounts.get(lr.join(':')) -
                amounts.get(ls.join(':'))

        })
    }

    const ids = new Map();
    let nextId = 1;
    for (key of keys) {
        if (!ids.has(key)) {
            ids.set(key, nextId)
            nextId++;
        }
    }

    for (key of keys) {
        value = amounts.get(key)
        let parentAtt = ''
        if (key.includes(':')) {
            split = key.split(':')
            split.pop()
            parent = split.join(':')
            parentId = ids.get(parent)
            parentAtt = `data-tt-parent-id="${parentId}"`
        }
        html.push(`<tr data-tt-id="${ids.get(key)}" ${parentAtt}>`);
        html.push(`<td>${escapeHtml(key)}</td>`)
        html.push(`<td  align="right">${formatter(value)}</td>`)
        if (details) {
            html.push(`<td  align="right"><a href="javascript:showModal('${key}')">postings...</td>`)
        }
        html.push(`</tr>`)
    }
    html.push('</table>')

    node.innerHTML = html.join('\n')

    $("#" + node.id + 'tree').treetable({ expandable: true });
}



module.exports = { makeTreeTable, showModal }