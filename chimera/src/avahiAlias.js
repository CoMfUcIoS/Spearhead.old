/**
 * @module framework
 * @submodule avahiAlias
 * @namespace framework
 *
 * @returns {Object} Module component
 */

import dbus        from 'dbus-native';
import { toASCII } from 'punycode';

const avahiAlias = function() {

  const namespace = 'org.freedesktop.Avahi',
      Avahi = {
        DBUS_NAME                  : namespace,
        DBUS_PATH_SERVER           : '/',
        DBUS_INTERFACE_SERVER      : namespace + '.Server',
        DBUS_INTERFACE_ENTRY_GROUP : namespace + '.EntryGroup',
        IF_UNSPEC                  : -1,
        PROTO_UNSPEC               : -1
      },
      Settings = {
        TTL        : 60,
        CLASS_IN   : 0x01,
        TYPE_CNAME : 0x05,
      };

  let _util,
      _bus;

  function _encode(name) {
    return _util.map(name.split('.'), function(p) {
      return toASCII(p);
    }).join('.');
  }

  function _encodeRdata(rdata) {
    return _util.map(rdata.split('.'), function(p) {
      p = toASCII(p);
      return String.fromCharCode(p.length) + p;
    }).join('') + '\0';
  }

  function _stringToByteArray(data) {
    return _util.reduce(data.split(''), function(d, p) {
      d.push(p.charCodeAt(0) & 0xFF);
      return d;
    }, []);
  }

  function _throwError({ error, message }) {
    throw new Error(`${message} : ${error}`);
  }

  function _publish(cname) {
    if (cname === 'default') {
      return;
    }

    const rootDomain = `${_util.hostname().toLowerCase()}.local`,
        service = _bus.getService(Avahi.DBUS_NAME);

    if (rootDomain === '.local') {
      return;
    }

    cname = `${cname}.${rootDomain}.local`;

    service.getInterface(Avahi.DBUS_PATH_SERVER, Avahi.DBUS_INTERFACE_SERVER, function(error, server) {
      if (error) {
        _throwError({ message : 'Error in getInterface', error });
      }
      server.EntryGroupNew(function(erro, entryGroup) { //eslint-disable-line
        if (erro) {
          _throwError({ message : 'Error in EntryGroupNew', error : erro });
        }

        service.getObject(entryGroup, function(err, obj) {
          if (err) {
            _throwError({ message : 'Error in getObject', error : err });
          }

          const group = obj.as(Avahi.DBUS_INTERFACE_ENTRY_GROUP);
          server.GetHostNameFqdn(function(er, rdata) { //eslint-disable-line
            if (er) {
              _throwError({ message : 'Error in GetHostNameFqdn', error : er });
            }

            // Encode data to send
            cname = _encode(cname);
            rdata = _encodeRdata(rdata);
            rdata = _stringToByteArray(rdata);

            // Register a alias
            _util.log('adding %s', cname);
            group.AddRecord(Avahi.IF_UNSPEC, Avahi.PROTO_UNSPEC, 0, cname, Settings.CLASS_IN, Settings.TYPE_CNAME, Settings.TTL, rdata, function(e, result) { //eslint-disable-line
              if (e) {
                _throwError({ message : 'Error in AddRecord', error : e });
              }
              group.Commit(function(errr, result) { //eslint-disable-line
                if (errr) {
                  _throwError({ message : 'Error in Commit', error : errr });
                }
              });
            });
          });

        });

      });
    });
  }

  /**
   * The avahiAlias component
   *
   * @class proxy
   */
  return {
    /*!
     * Module dependencies
     *
     * @hidden
     * @type {Array}
     */
    requires : [
      'util'
    ],

    /*!
     * Module initialization function
     *
     * @method _init_
     * @hidden
     * @param  {Array} requires Dependencies injections
     */
    _init_ : function(requires) {
      /*eslint-disable dot-notation*/
      _util   = requires['util'];
      /*eslint-enable dot-notation*/

      _bus     = dbus.systemBus();
    },

    publish : _publish,
  };
};

export default avahiAlias;
