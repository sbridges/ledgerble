/**
 * maintains postings table
 */

function updatePostings(postings, formatter, postingsTable, paging) {


    const rows = []
    for (i = 0; i < postings.length; i = i + 1) {
        p1 = postings[i]
        let p2;
        if (i + 1 < postings.length) {
            p2 = postings[i + 1]
        }

        if (p2 && p1.date.getTime() === p2.date.getTime() && p1.amount === -p2.amount && p1.merchant === p2.merchant && p1.type === p2.type) {
            i++
            rows.push([
                p1.date.getFullYear() + '/' + (1 + p1.date.getMonth()) + '/' + p1.date.getDate() + "<br>&nbsp",
                escapeHtml(p1.accounts.join(':')) + "<br>" + escapeHtml(p2.accounts.join(':')),
                escapeHtml(p1.merchant) + "<br>&nbsp",
                formatter(p1.amount) + "<br>&nbsp",
                p1.type
            ])
        } else {
            rows.push([
                p1.date.getFullYear() + '/' + (1 + p1.date.getMonth()) + '/' + p1.date.getDate(),
                escapeHtml(p1.accounts.join(':')),
                escapeHtml(p1.merchant),
                formatter(p1.amount),
                p1.type
            ])
        }



    }

    const tableElement = postingsTable.get(0);
    if (tableElement._table) {
        tableElement._table.destroy();
    }



    tableElement._table = postingsTable.DataTable({
        data: rows,
        deferRender: true,
        lengthMenu: [ [15, 50, 500, -1], [15, 50, 500, "All"] ],
        paging: paging,
        searching: paging,
        order: [[0, "desc"]],
        'columnDefs': [
            {
                "targets": 3,
                "className": "text-right",
            }

        ],

    });



}


module.exports = { updatePostings }