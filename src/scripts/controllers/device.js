angular.module('zetta').controller('DeviceCtrl', [
  '$scope', '$state', 'zettaShared', function($scope, $state, zettaShared) {
  $scope.device = null;
  $scope.request = null;

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

    zettaShared.state.onStreamUpdate = function() {
      $scope.$apply();
    };

    var anchor = document.createElement('a');
    anchor.href = $state.params.url;

    $scope.request = ['GET ' + anchor.pathname,
      'Host: ' + anchor.hostname,
      'Accept: application/vnd.siren+json'].join('\r\n');

    if (!zettaShared.state.servers.length) {
      zettaShared.state.loadServers(rootUrl, function() {
        findDevice();
      });
    } else {
      findDevice();
    };

    $scope.stateLogs = [];
  };

  var findDevice = function() {
    zettaShared.state.servers.forEach(function(server) {
      if (!server.devices) {
        return;
      }

      server.devices.forEach(function(device) {
        if (device.href === $state.params.url) {
          $scope.device = device;
          $scope.logger(device.monitorHref);

          zettaShared.state.breadcrumbs = [
            { title: 'root', href: zettaShared.state.root },
            { title: server.name, href: zettaShared.state.root, filter: server.name },
            { title: device.properties.name || device.properties.type }
          ];
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
      //console.log(d);
      $scope.$apply(function() {
        $scope.stateLogs.unshift({
          transition: d.transition,
          state: d.properties.state,
          msg: (d.input[0]) ? d.input[0].value : null,
          time: {
            time: d.timestamp,
            localTime: dt.toLocaleString(),
            elapsed: etime
          }
        });

        if($scope.stateLogs.length > 10) {
          $scope.stateLogs.pop()
        }
      });
    }
  };
}]);
