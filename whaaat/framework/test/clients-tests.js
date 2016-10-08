import { assert } from 'chai';
import framework from '../';

const _clients   = framework.initialize().clients;

describe('clients', function() {
  describe('template function', function() {
    it('template unit test', function() {

      assert.equal(1, 1);
    });
  });
});
