angular.module('zetta').controller('RootCtrl', [
  '$scope', '$state', '$http', 'navigator', 'zettaShared', function($scope, $state, $http, navigator, zettaShared) {
    $scope.pinned = [];
    $scope.servers = zettaShared.servers = [];
    $scope.muted = [];

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
              /*if (typeof deviceData === 'string') {
                deviceData = JSON.parse(deviceData);
              }

              var device = {
                href: selfLink.href
              };

              if (deviceData.properties) {
                device.properties = deviceData.properties;
              }

              var objectStreamLinks = deviceData.links.filter(function(link) {
                return link.rel.indexOf('http://rels.zettajs.io/object-stream') !== -1;
              });

              if (objectStreamLinks.length) {
                device.streams = [];
              }

              objectStreamLinks.forEach(function(objectStream) {
                if (objectStream.title === 'logs') {
                  device.monitorHref = objectStream.href;
                  //device.socket = new WebSocket(objectStream.href);
                } else {
                  var stream = {
                    name: objectStream.title,
                    href: objectStream.href,
                    socket: new WebSocket(objectStream.href),
                    pinned: false,
                    muted: false,
                    data: [],
                    min: null,
                    max: null,
                    type: null,
                    current: objectStream.rel.indexOf('monitor') !== -1
                    ? device.properties[objectStream.title] : null,
                  };

                  stream.socket.onclose = function() {
                    stream.socket = new WebSocket(stream.href);
                  };

                  stream.type = zettaShared.getAssumedStreamType(stream);
                  device.streams.push(stream);
                }
              });


              if (deviceData.actions && deviceData.actions.length) {
                device.actions = deviceData.actions;
              }*/

              var device = zettaShared.buildDeviceFromData(deviceData);
              server.devices.push(device);

              zettaShared.wireUpStreams(device, function() {
                $scope.$apply();
              });
            });
          });
        });
      });

    };

    $scope.resolve = function(href) {
      navigator.transitionTo(href, { url: href });
    };
    
  }
]);
