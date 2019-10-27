var assert = require('assert');
var {parseHLedgerVal} = require('../hledger')

describe('parse hledger', function() {
      it('should parse 123.45', function() {
        assert.equal(parseHLedgerVal('123'), 123);
        assert.equal(parseHLedgerVal('123.45'), 123.45);
        assert.equal(parseHLedgerVal('123,456.78'), 123456.78);
      });

      it('should parse 123,45', function() {
        assert.equal(parseHLedgerVal('123'), 123);
        assert.equal(parseHLedgerVal('123,45'), 123.45);
        assert.equal(parseHLedgerVal('123.456,78'), 123456.78);
      });
  });