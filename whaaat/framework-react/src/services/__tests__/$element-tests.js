// __tests__/$element-tests.js
'use strict';

jest.unmock('../$element.js');

import $element from '../$element';

describe('$element', () => {
  it('Template Test', ()=> {
    expect(1).toEqual(1);
  });
});
