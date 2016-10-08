// __tests__/Util-tests.js
'use strict';


import framework from '../../';

const _util = framework.initialize().util;

describe('Util', () => {

  describe('log function', () => {
    it('Use util log mechanism', () => {
      _util.log('Testing log mechanism');
      // Thats a dummy test :(
      expect(1).toEqual(1);
    });
  });

  describe('Object', () => {

    describe('get Function', () => {
      it('get a top key', () => {
        const obj = {
          key1 : 1,
          key2 : 2,
          key3 : 3,
          key4 : 'test',
          key5 : {
            subkey1 : 'test2'
          }
        };
        let test = null;

        test = _util.object.get(obj, 'key1');
        expect(test).toEqual(1);
        test = _util.object.get(obj, 'key4');
        expect(test).toEqual('test');
      });

      it('get a sub key', () => {
        const obj = {
          key1 : 1,
          key2 : 2,
          key3 : 3,
          key4 : 'test',
          key5 : {
            subkey1 : 'test2'
          }
        };
        let test = null;
        test = _util.object.get(obj, 'key5.subkey1');
        expect(test).toEqual('test2');
      });

      it('Get default value on non exist key', () => {
        const obj = {
          key1 : 1,
          key2 : 2,
          key3 : 3,
          key4 : 'test',
          key5 : {
            subkey1 : 'test2'
          }
        };
        let test = _util.object.get(obj, 'key13', null);
        expect(test).toEqual(null);
      });

      it('Get default value on non string key', () => {
        const obj = {
          key1 : 1,
          key2 : 2,
          key3 : 3,
          key4 : 'test',
          key5 : {
            subkey1 : 'test2'
          }
        };
        let test = _util.object.get(obj, 1, 'noString');
        expect(test).toEqual('noString');
      });
    });

    // describe('isEmpty Function', () => {
    //   it('Object is empty returns true', () => {
    //     let test = _util.object.isEmpty({});
    //     expect(test).toEqual(true);
    //   });

    //   it('Object is not empty returns false', () => {
    //     let test = _util.object.isEmpty({
    //       test: 1
    //     });
    //     expect(test).toEqual(false);

    //   });

    //   it('Object passed is not an object returns true', () => {
    //     let test = test = _util.object.isEmpty('hello !');
    //     expect(test).toEqual(true);
    //   });
    // });

    // describe('merge Function', () =>{
    //   it('Merging 2 objects', () => {
    //     let test = _util.object.merge({
    //       test2 : 2
    //     },
    //       {
    //         test : 1
    //       });

    //     expect(test).toEqual({
    //       test  : 1,
    //       test2 : 2
    //     });
    //   });

    //   it('Merging an objects with a non object', () => {
    //     let test = _util.object.merge({
    //       test2 : 2
    //     }, 'hello');
    //     expect(test).toEqual({
    //       test2 : 2
    //     });
    //   });

    //   it('Merging objects with objects in them', () => {
    //     let test = _util.object.merge({
    //       test2 : 2
    //     },
    //       {
    //         test3 : {
    //           test4 : 123
    //         }
    //       });
    //     expect(test).toEqual({
    //       test2 : 2,
    //       test3 : {
    //         test4 : 123
    //       }
    //     });
    //   });

    //   it('Merge will replace same keys', () => {
    //     let test = _util.object.merge({
    //       test3 : {
    //         test4 : 123
    //       }
    //     },
    //       {
    //         test3 : {
    //           new : 333
    //         }
    //       });
    //     expect(test).toEqual({
    //       test3 : {
    //         new : 333
    //       }
    //     });
    //   });

    //   it('Passing non objects into merge ll return an empty one', () => {
    //     let test = _util.object.merge('123', 'Obj3');
    //     expect(test).toEqual({});
    //   });
    // });

    describe('sanity function', () => {
      it('Check sanity of a valid object', () => {
        let test = _util.object.sanity({
          key1 : {
            hello : 'world'
          },
          key2 : 'Hello World'
        },
          {
            key1 : {
              mandatory : true,
              type      : 'object'
            },
            key2 : {
              mandatory : true,
              type      : 'string'
            },
            key3 : {
              mandatory : false
            }
          });

        expect(test).toEqual(true);
      });

      it('Object doesnt meet the expected', () => {
        let test = _util.object.sanity({
          key1 : 'hello'
        },
          {
            key1 : {
              mandatory : true,
              type      : 'object'
            },
            key2 : {
              mandatory : true,
              type      : 'string'
            },
            key3 : {
              mandatory : false
            }
          });
        expect(test).toEqual(false);
      });
    });

    it('Object has more than the mandatory keys', () => {
      let test = _util.object.sanity({
        key1 : {
          hello : 'world'
        },
        key2 : 'Hello World',
        key3 : 2,
        key4 : 123
      },
        {
          key1 : {
            mandatory : true,
            type      : 'object'
          },
          key2 : {
            mandatory : true,
            type      : 'string'
          },
          key3 : {
            mandatory : false
          }
        });
      expect(test).toEqual(true);
    });

    it('Passing empty objects as arguments', () => {
      let test = _util.object.sanity({}, {
        key1 : {
          mandatory : true,
          type      : 'object'
        },
        key2 : {
          mandatory : true,
          type      : 'string'
        },
        key3 : {
          mandatory : false
        }
      });
      expect(test).toEqual(false);

      test = _util.object.sanity({
        key1 : {
          mandatory : true,
          type      : 'object'
        },
        key2 : {
          mandatory : true,
          type      : 'string'
        },
        key3 : {
          mandatory : false
        }
      },
        {});
      expect(test).toEqual(false);
    });

    it('Sanitize an object without mandatories', () => {
      let test = _util.object.sanity({ key1 : 'hellow' }, {
        key1 : {
          type : 'object'
        }
      });
      expect(test).toEqual(true);
    });
  });

});
