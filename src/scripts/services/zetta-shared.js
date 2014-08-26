angular.module('zetta').factory('zettaShared', ['$http', 'navigator', function($http, navigator) {
  var state = {
    servers: [],
    root: null,
    breadcrumbs: null,
    pinned: [],
    muted: [],
    savedStreams: [],
    onStreamUpdate: function() { /* default no op */ }
  };

  var getAssumedStreamType = function(stream) {
    return isNaN(parseInt(stream.current))
            ? 'categorical'
            : 'numerical';
  };

  var wireUpStreams = function(device, cb) {
    device.streams.forEach(function(stream) {
      var oldOnMessage = stream.socket.onmessage;
      stream.socket.onmessage = function(event) {
        if (oldOnMessage) {
          oldOnMessage(event);
        }

        //Add data to model w/ timestamp here
        var d = JSON.parse(event.data);

        var update = {
          target: d.topic.replace(/\//g, '_'),
          data: d.data
        }

        var color;
        stream.data.push([new Date(), update.data]);

        stream.current = update.data;

        stream.type = getAssumedStreamType(stream);

        if (stream.min === null) {
          stream.min = d.data;
        }

        if (stream.max === null) {
          stream.max = d.data;
        }

        if (d.data < stream.min) {
          stream.min = d.data;
        }

        if (d.data > stream.max) {
          stream.max = d.data;
        }

        if(stream.data.length > 40){
          stream.data.shift();
        }

        cb();
      }
    });
  };

  var buildDeviceFromData = function(deviceData) {
    if (typeof deviceData === 'string') {
      deviceData = JSON.parse(deviceData);
    }

    var device = {
      properties: deviceData.properties,
      body: deviceData
    };

    deviceData.links.forEach(function(link) {
      if (link.rel.indexOf('up') !== -1) {
        var serverName = link.title;
        state.servers.forEach(function(s) {
          if (s.name === serverName) {
            device.server = s;
          }
        });
      }
      if (link.rel.indexOf('self') !== -1) {
        device.href = link.href;
      }
    });


    var objectStreamLinks = deviceData.links.filter(function(link) {
      return link.rel.indexOf('http://rels.zettajs.io/object-stream') !== -1;
    });

    if (objectStreamLinks.length) {
      device.streams = [];
    }

    objectStreamLinks.forEach(function(objectStream) {
      if (state.savedStreams.hasOwnProperty(objectStream.href)) {
        var stream = state.savedStreams[objectStream.href];
        device.streams.push(stream);
        return;
      }

      if (objectStream.title === 'logs') {
        device.monitorHref = objectStream.href;
      } else {
        var stream = {
          id: device.server.name.replace(/\./g, '-') + 'device' + device.server.devices.length + 'stream' + state.savedStreams.length + objectStream.title,
          name: objectStream.title,
          href: objectStream.href,
          socket: new WebSocket(objectStream.href),
          device: device,
          data: [],
          pinned: false,
          available: true,
          open: true,
          pinOpen: false,
          muteOpen: false,
          muted: false,
          min: null,
          max: null,
          type: null,
          current: objectStream.rel.indexOf('monitor') !== -1
                    ? device.properties[objectStream.title] : null,
        };

        stream.socket.onclose = function() {
          var oldOnMessage = stream.socket.onmessage;
          stream.socket = new WebSocket(stream.href);
          stream.socket.onmessage = oldOnMessage;
        };

        stream.type = getAssumedStreamType(stream);

        state.savedStreams[stream.href] = stream;
        device.streams.push(stream);
      }
    });

    device.links = deviceData.links;

    if (deviceData.actions) {
      device.actions = deviceData.actions.map(function(action, i) {
        action.device = device;
        action.available = true;
        action.id = device.server.name.replace(/\./g, '-') + 'device' + device.server.devices.length + 'action' + i + action.name;
        action.open = true;
        action.pinOpen = false;
        action.muteOpen = false;
        return action;
      }).sort(function(a, b) {
        var identifierA = a.name;
        var identifierB = b.name;

        if (identifierA > identifierB) {
          return 1;
        } else if (identifierA < identifierB) {
          return -1; 
        } else {
          return 0;
        }
      });
    }

    return device;
  };

  function loadServers(rootUrl, execute, cb) {
    $http.get(rootUrl).then(function(response) {
      var data = response.data;
      if (typeof data === 'string') {
        data = JSON.parse(data);
      }

      var serverLinks = data.links.filter(function(link) {
        return link.rel.indexOf('http://rels.zettajs.io/server') !== -1;
      });

      if (serverLinks.length) {
        var server = serverLinks[0];
        state.servers.push({
          name: server.title,
          type: 'server',
          href: server.href
        });
      }

      var peerLinks = data.links.filter(function(link) {
        return link.rel.indexOf('http://rels.zettajs.io/peer') !== -1;
      });

      peerLinks.forEach(function(peer) {
        state.servers.push({
          name: peer.title,
          type: 'peer',
          href: peer.href
        });
      });

      crawl(execute, cb);
    });
  };

  var crawl = function(execute, cb) {
    var serverCount = 0;
    state.servers.forEach(function(server) {
      $http.get(server.href).then(function(response) {
        serverCount++;
        var data = response.data;
        if (typeof data === 'string') {
          data = JSON.parse(data);
        }

        data.links.forEach(function(link) {
          if (link.rel.indexOf('monitor') !== -1) {
            server.monitorHref = link.href;
            server.monitorSocket = new WebSocket(link.href);
          }
        });
        
        if (!data.entities) {
          return;
        }

        server.devices = [];

        var devices = data.entities.filter(function(entity) {
          return entity.class.indexOf('device') !== -1;
        });

        var foundCount = 0;
        var foundDevices = [];
        devices.forEach(function(device) {
          var selfLink;
          device.links.forEach(function(link) {
            if (link.rel.indexOf('self') !== -1) {
              selfLink = link;
            }
          });

          if (!selfLink) {
            return;
          }

          $http.get(selfLink.href).then(function(response) {
            var deviceData = response.data;

            var device = buildDeviceFromData(deviceData);

            if (device.actions && device.actions.length) {
              device.actions = device.actions.map(function(action) {
                if (!action.execute) {
                  action.execute = function(cb) {
                    execute(action, cb);
                  };
                }

                return action;
              });
            }

            foundDevices.push(device);
            foundDevices = foundDevices.sort(function(a, b) {
              var identifierA = a.properties.name || a.properties.type;
              var identifierB = b.properties.name || b.properties.type;

              if (identifierA > identifierB) {
                return 1;
              } else if (identifierA < identifierB) {
                return -1; 
              } else {
                return 0;
              }
            });

            foundCount++;

            if (foundCount === devices.length) {
              server.devices = foundDevices;
              server.devices.forEach(function(device) {
                wireUpStreams(device, function() {
                  state.onStreamUpdate();
                });
                
                if (device.streams) {
                  device.streams.forEach(function(stream) {
                    stream.open = true;
                  });
                }

                if (device.actions) {
                  device.actions.forEach(function(action) {
                    action.open = true;
                  });
                }
              });

              if (serverCount === state.servers.length) {
                if (cb !== undefined && cb !== null) cb(state.servers);
              }
            }
          });
        });
      });
    });
  };

  var execute = function(action, cb) {
    navigator.execute(action).then(function(result) {
      if (result.noop) {
        return;
      }
    
      var data = result.data;
      var device = state.buildDeviceFromData(data);

      if (device.server) {
        for (var i = 0; i < device.server.devices.length; i++) {
          var d = device.server.devices[i];
          if (d.href === device.href) {
            d.body = device.body;
            d.properties = device.properties;
            if (!device.actions && device.actions.length) {
              return;
            }

            var earlierActions = d.actions;

            var newActions = device.actions.map(function(action) {
              action.device = device;
              action.execute = function() {
                execute(action);
              };
              return action;
            });

            var earlierNames = earlierActions.map(function(action) {
              return action.name;
            });

            var newNames = newActions.map(function(action) {
              return action.name;
            });

            earlierActions.forEach(function(action) {
              var index = newNames.indexOf(action.name);
              if (index === -1) {
                action.open = false;
                action.available = false;
                newActions.push(action);
              }
            });

            var resolvedNames = newActions.map(function(action) {
              return action.name;
            });

            state.pinned.filter(function(characteristic, i) {
              if (!characteristic.type && characteristic.device.href == device.href) { // if it's an action
                var index = resolvedNames.indexOf(characteristic.name);
                if (index !== -1) {
                  newActions[index].pinned = true;
                  newActions[index].pinOpen = true;
                  state.pinned[i] = newActions[index];
                }
              }
            });

            state.muted.filter(function(characteristic, i) {
              if (!characteristic.type && characteristic.device.href == device.href) { // if it's an action
                var index = resolvedNames.indexOf(characteristic.name);
                if (index !== -1) {
                  newActions[index].muted = true;
                  newActions[index].muteOpen = true;
                  state.muted[i] = newActions[index];
                }
              }
            });

            device.actions = newActions.sort(function(a, b) {
              var identifierA = a.name;
              var identifierB = b.name;

              if (identifierA > identifierB) {
                return 1;
              } else if (identifierA < identifierB) {
                return -1; 
              } else {
                return 0;
              }
            });

            device.server.devices[i].actions = device.actions;
          }

          if (cb) cb();
        }
      }
    });
  };

  state.wireUpStreams = wireUpStreams;
  state.getAssumedStreamType = getAssumedStreamType;
  state.buildDeviceFromData = buildDeviceFromData;
  state.loadServers = loadServers;
  state.execute = execute;

  return { state: state };
}]);
