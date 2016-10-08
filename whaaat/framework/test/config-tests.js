import { assert } from 'chai';
import framework from '../';

const _config   = framework.initialize().config;

describe('config', function() {
  describe('get function', function() {
    it('Should return the requested key from the config', function() {
      let value = _config.get('unitTests');
      assert.equal(value, 'true');
    });
  });
});
