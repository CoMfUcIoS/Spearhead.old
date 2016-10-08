import { assert } from 'chai';
import framework from '../';

const _server   = framework.initialize().server;

describe('server', function() {
  describe('template function', function() {
    it('template unit test', function() {

      assert.equal(1, 1);
    });
  });
});
