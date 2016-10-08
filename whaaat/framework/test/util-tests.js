import { assert } from 'chai';
import framework from '../';

const _util     = framework.initialize().util;

describe('Util', () => {

  describe('log function', () => {
    it('Use util log mechanism', () => {
      _util.log('Testing log mechanism');
      // Thats a dummy test :(
      assert.equal(1, 1);
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
        assert.equal(test, 1);
        test = _util.object.get(obj, 'key4');
        assert.equal(test, 'test');
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
        assert.equal(test, 'test2');
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
        assert.equal(test, null);
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
        assert.equal(test, 'noString');
      });
    });

    describe('set Function', () => {
      it('set a key to an object', () => {
        const obj = {};

        _util.object.set(obj, 'key1', null);
        assert.equal(obj.key1, null);
        _util.object.set(obj, 'key2.test1', 2);
        assert.equal(obj.key2.test1, 2);
      });

      it('set a deep path in an object', () => {
        const obj = {};

        _util.object.set(obj, 'key3.subkey1.subsubkey2.subsubsubk3', 'test');
        assert.equal(obj.key3.subkey1.subsubkey2.subsubsubk3, 'test');
      });
    });

    describe('isEmpty Function', () => {
      it('Object is empty returns true', () => {
        let test = _util.object.isEmpty({});
        assert.equal(test, true);
      });

      it('Object is not empty returns false', () => {
        let test = _util.object.isEmpty({
          test : 1
        });
        assert.equal(test, false);

      });

      it('Object passed is not an object returns true', () => {
        let test = _util.object.isEmpty('hello !');
        assert.equal(test, true);
      });
    });

    describe('merge Function', () =>{
      it('Merging 2 objects', () => {
        let test = _util.object.merge({
          test2 : 2
        },
          {
            test : 1
          });

        assert.deepEqual(test, { test : 1, test2 : 2 });
      });

      it('Merging an objects with a non object', () => {
        let test = _util.object.merge({
          test2 : 2
        }, 'hello');
        assert.deepEqual(test, {
          test2 : 2
        });
      });

      it('Merging objects with objects in them', () => {
        let test = _util.object.merge({
          test2 : 2
        },
          {
            test3 : {
              test4 : 123
            }
          });
        assert.deepEqual(test, {
          test2 : 2,
          test3 : {
            test4 : 123
          }
        });
      });

      it('Merge will replace same keys', () => {
        let test = _util.object.merge({
          test3 : {
            test4 : 123
          }
        },
          {
            test3 : {
              new : 333
            }
          });
        assert.deepEqual(test, {
          test3 : {
            new : 333
          }
        });
      });

      it('Passing non objects into merge ll return an empty one', () => {
        let test = _util.object.merge('123', 'Obj3');
        assert.deepEqual(test, {});
      });
    });

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

        assert.equal(test, true);
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
        assert.equal(test, false);
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
      assert.equal(test, true);
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
      assert.equal(test, false);

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
      assert.equal(test, false);
    });

    it('Sanitize an object without mandatories', () => {
      let test = _util.object.sanity({ key1 : 'hellow' }, {
        key1 : {
          type : 'object'
        }
      });
      assert.equal(test, true);
    });
  });

  describe('guid function', () => {
    it('generate a random guid', () => {
      let guid  = _util.guid([]);

      assert.equal(typeof guid, 'string');
    });
  });

});
