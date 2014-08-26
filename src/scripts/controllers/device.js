angular.module('zetta').controller('DeviceCtrl', [
  '$scope', '$state', '$http', 'navigator', 'zettaShared', function($scope, $state, $http, navigator, zettaShared) {
  $scope.device = null;
  $scope.request = null;
  $scope.response = null;
  $scope.servers = zettaShared.state.servers;

  $scope.init = function() {
    var rootUrl = zettaShared.state.root;

    if (!rootUrl) {
      var parser = document.createElement('a');
      parser.href = $state.params.url;
      rootUrl = parser.protocol + '//' + parser.hostname;
      if (parser.port) {
        rootUrl += ':' + parser.port;
      }

      zettaShared.state.root = rootUrl;
    }

    if (!zettaShared.state.servers.length) {
      zettaShared.state.loadServers(rootUrl, zettaShared.state.execute, function() {
        findDevice();
      });
    } else {
      findDevice();
    };


    $scope.stateLogs = [];
  };

  var findDevice = function() {
    var anchor = document.createElement('a');
    anchor.href = $state.params.url;

    $scope.request = ['GET ' + anchor.pathname,
      'Host: ' + anchor.hostname,
      'Accept: application/vnd.siren+json'].join('\r\n');

    zettaShared.state.servers.forEach(function(server) {
      server.devices.forEach(function(device) {
        if (device.href === $state.params.url) {
          $scope.device = device;
          $scope.logger(device.monitorHref);

          zettaShared.state.breadcrumbs = [ { title: 'root', href: zettaShared.state.root }, { title: server.name, href: server.href },
            { title: device.properties.name || device.properties.type , href: $state.params.url }];

        }
      });
    });
  };

  $scope.loggerSocket = null;
  $scope.loggerUrl = null;
  $scope.logger = function(url){
    if ($scope.loggerSocket && $scope.loggerUrl === url) {
      return;
    } else {
      if ($scope.loggerSocket) {
        $scope.loggerSocket.close();
      }

      $scope.loggerUrl = url;
    }

    $scope.loggerSocket = new WebSocket($scope.loggerUrl);
    
    $scope.loggerSocket.onmessage = function(event) {
      var d = JSON.parse(event.data);
      
      var dt = new Date(d.timestamp);
      var etime = 0;
      if($scope.stateLogs.length){
        etime = d.timestamp -  $scope.stateLogs[0].time.time;
      }
      
      $scope.$apply(function() {
        $scope.stateLogs.unshift({
          transition: d.transition,
          state: d.properties.state,
          msg: null,
          time: {
            time: d.timestamp,
            localTime: dt.toLocaleString(),
            elapsed: etime
          }
        });

        if($scope.stateLogs.length > 10){ $scope.stateLogs.pop() } //keep things civil
      });
    }
  };
  
  var follow = function(rootUrl) {
    var url = rootUrl;

    $scope.url = url;

    $state.params.url = url;

    var anchor = document.createElement('a');
    anchor.href = url;

    $scope.request = ['GET ' + anchor.pathname,
      'Host: ' + anchor.hostname,
      'Accept: application/vnd.siren+json'].join('\r\n');

    navigator.redirectOrFetch(url, $state.params).then(function(data) {
      $scope.response = {};

      ['class', 'properties', 'entities', 'actions', 'links'].forEach(function(prop) {
        if (data.hasOwnProperty(prop)) {
          $scope.response[prop] = data[prop];
        }
      });

      if ($scope.response.actions) {
        $scope.response.actions = $scope.response.actions.map(function(action) {
          var a = {};
          ['class', 'name', 'method', 'href', 'fields'].forEach(function(prop) {
            if (action.hasOwnProperty(prop)) {
              a[prop] = action[prop];
            }
          });

          return a;
        });
      }
    });
  };

}]);
