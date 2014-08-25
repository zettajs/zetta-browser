angular.module('zetta').controller('OverviewCtrl', [
  '$scope', '$state', '$http', 'navigator', 'zettaShared', function($scope, $state, $http, navigator, zettaShared) {
  $scope.pinned = zettaShared.pinned;
  $scope.servers = zettaShared.servers;
  $scope.muted = zettaShared.muted;

  $scope.execute = function(action, cb) {
    navigator.execute(action).then(function(result) {
      if (result.noop) {
        return;
      }
    
      var data = result.data;
      var device = zettaShared.buildDeviceFromData(data);
      var selfUrl;
      var serverName;

      device.links.forEach(function(link) {
        if (link.rel.indexOf('up') !== -1) {
          serverName = link.title;
        }
        if (link.rel.indexOf('self') !== -1) {
          selfUrl = link.href;
        }
      });

      var server;

      zettaShared.servers.forEach(function(s) {
        if (s.name === serverName) {
          server = s;
        }
      });

      if (server) {
        for(var i = 0; i < server.devices.length; i++) {
          var d = server.devices[i];
          if (d.href === selfUrl) {
            device.server = server;

            if (!device.actions && device.actions.length) {
              return;
            }

            var earlierActions = d.actions;

            var newActions = device.actions.map(function(action) {
              action.device = device;
              action.execute = function() {
                $scope.execute(action);
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
                action.available = false;
                newActions.push(action);
              }
            });

            var resolvedNames = newActions.map(function(action) {
              return action.name;
            });

            $scope.pinned.filter(function(characteristic, i) {
              if (!characteristic.type && characteristic.device.href == selfUrl) { // if it's an action
                var index = resolvedNames.indexOf(characteristic.name);
                if (index !== -1) {
                  $scope.pinned[i] = newActions[index];
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

            server.devices[i].actions = device.actions;
          }

          if (cb) cb();
        }
      }
    });
  };

  $scope.init = function() {
    $scope.servers = zettaShared.servers = [];
    zettaShared.root = $state.params.url;
    zettaShared.breadcrumbs = [ { title: 'root', href: $state.params.url }];
    $http.get($state.params.url).then(function(response) {
      var data = response.data;
      if (typeof data === 'string') {
        data = JSON.parse(data);
      }

      var serverLinks = data.links.filter(function(link) {
        return link.rel.indexOf('http://rels.zettajs.io/server') !== -1;
      });

      if (serverLinks.length) {
        var server = serverLinks[0];
        zettaShared.servers.push({
          name: server.title,
          type: 'server',
          href: server.href
        });
      }

      var peerLinks = data.links.filter(function(link) {
        return link.rel.indexOf('http://rels.zettajs.io/peer') !== -1;
      });

      peerLinks.forEach(function(peer) {
        zettaShared.servers.push({
          name: peer.title,
          type: 'peer',
          href: peer.href
        });
      });

      $scope.crawl();
    });
  };

  $scope.crawl = function() {
    zettaShared.servers.forEach(function(server) {
      $http.get(server.href).then(function(response) {
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

            var device = zettaShared.buildDeviceFromData(deviceData);
            device.server = server;

            if (device.actions && device.actions.length) {
              device.actions = device.actions.map(function(action) {
                action.execute = function(cb) {
                  $scope.execute(action, cb);
                };
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
                zettaShared.wireUpStreams(device, function() {
                  $scope.$apply();
                });
              });
            }
          });
        });
      });
    });
  };

  $scope.resolve = function(href) {
    navigator.transitionTo(href, { url: href });
  };

  $scope.pin = function(characteristic) {
    characteristic.pinned = true;

    if (characteristic.muted) {
      $scope.unmute(characteristic);
    }

    if ($scope.pinned.indexOf(characteristic) === -1) {
      $scope.pinned.push(characteristic);
    } else {
      $scope.unpin(characteristic);
    }
  };

  $scope.unpin = function(characteristic) {
    var index = $scope.pinned.indexOf(characteristic);
    if (index > -1) {
      $scope.pinned[index].pinned = false;
      $scope.pinned.splice(index, 1);
    }
  };

  $scope.mute = function(characteristic) {
    characteristic.muted = true;
    if (characteristic.pinned) {
      $scope.unpin(characteristic);
    }

    if ($scope.muted.indexOf(characteristic) === -1) {
      $scope.muted.push(characteristic);
    } else {
      $scope.unmute(characteristic);
    }
  };

  $scope.unmute = function(characteristic) {
    
    //Need to animate fading back into device list
    
    var index = $scope.muted.indexOf(characteristic);
    if (index > -1) {
      $scope.muted[index].muted = false;
      $scope.muted.splice(index, 1);
    }
  };
}]);
