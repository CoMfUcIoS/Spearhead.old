import { assert } from 'chai';
import framework from '../';

const _queue   = framework.initialize().queue;

describe('queue', function() {
  describe('template function', function() {
    it('template unit test', function() {

      assert.equal(1, 1);
    });
  });
});
