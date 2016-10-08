// __tests__/config-tests.js
'use strict';

jest.unmock('../config.js');

import framework from '../../';

const _config = framework.initialize().config;

describe('config', () => {
  describe('get function', () =>{
    it('Gets a value from config.json', () => {
      let test = _config.get('unitTest');
      expect(test).toEqual('test key');
    });
  });
});
