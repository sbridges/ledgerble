/*
 * utilties for working with hledger  
 */

function parseHLedgerVal(val) {
    //hledge may format numbers as 123,456.78 or 123.456,78
    //guess the format
    
    if(val.match(/[0-9\.]+,\d\d$/)) {
      val = val.replace('.', '');        
      val = val.replace(',', '.');        
    } else {
      val = val.replace(',', '');        
    }
    return parseFloat(val)
}


module.exports = { parseHLedgerVal}