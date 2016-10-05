var createAliases = function() {
  var _      = require('lodash'),
      dbus    = require('dbus-native'),
      toASCII = require('punycode').toASCII,
      bus     = dbus.systemBus(),
    
    
      namespace = 'org.freedesktop.Avahi',
      Avahi = {
        DBUS_NAME: namespace,
        DBUS_PATH_SERVER: '/',
        DBUS_INTERFACE_SERVER: namespace + '.Server',
        DBUS_INTERFACE_ENTRY_GROUP: namespace + '.EntryGroup',
        IF_UNSPEC: -1,
        PROTO_UNSPEC: -1
      },
      Settings = {
        TTL: 60,
        CLASS_IN: 0x01,
        TYPE_CNAME: 0x05,
      };


  function _encode(name) {
    return _.map(name.split('.'), function(p) {
      return toASCII(p);
    }).join('.');
  }

  function _encodeRdata(rdata) {
    return _.map(rdata.split('.'), function(p) {
      p = toASCII(p);
      return String.fromCharCode(p.length) + p;
    }).join('') + '\0';
  }

  function _stringToByteArray(data) {
    return _.reduce(data.split(''), function(data, p) {
      data.push(p.charCodeAt(0) & 0xFF);
      return data;
    }, []);
  }

  function _publish(cname) {
    var service = bus.getService(Avahi.DBUS_NAME);
    service.getInterface(Avahi.DBUS_PATH_SERVER, Avahi.DBUS_INTERFACE_SERVER, function(err, server) {
      if (err) { throw new Error('Error in getInterface: ' + err); }
      server.EntryGroupNew(function(err, entry_group) {
        if (err) { throw new Error('Error in EntryGroupNew: ' + err); }

        service.getObject(entry_group, function(err, obj) {
          if (err) { throw new Error('Error in getObject: ' + err); }

          var group = obj.as(Avahi.DBUS_INTERFACE_ENTRY_GROUP);
          server.GetHostNameFqdn(function(err, rdata) {
            if (err) { throw new Error('Error in GetHostNameFqdn: ' + err); }

            // Encode data to send
            cname = _encode(cname);
            rdata = _encodeRdata(rdata);
            rdata = _stringToByteArray(rdata);

            // Register a alias
            console.log('adding %s', cname);
            group.AddRecord(Avahi.IF_UNSPEC, Avahi.PROTO_UNSPEC, 0, cname, Settings.CLASS_IN, Settings.TYPE_CNAME, Settings.TTL, rdata, function(err, result) {
              if (err) { throw new Error('Error in AddRecord: ' + err); }
              group.Commit(function(err, result) {
                if (err) { throw new Error('Error in Commit: ' + err); }
              });
            });
          });

        });

      });
    });
  }


  return {
    publish : _publish
  };
}();

module.exports = createAliases;