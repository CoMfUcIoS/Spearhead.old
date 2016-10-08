import { assert } from 'chai';
import framework from '../';

const  _watch   = framework.initialize().watch;

describe('watch', function() {
  describe('template function', function() {
    it('template unit test', function() {

      assert.equal(1, 1);
    });
  });
});
