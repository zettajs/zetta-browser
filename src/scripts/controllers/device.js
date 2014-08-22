angular.module('zetta').controller('DeviceCtrl', [
  '$scope', '$state', '$http', 'navigator', 'zettaShared', function($scope, $state, $http, navigator, zettaShared) {
    //leaflet, I'm beside myself. This default marker gets overriden by the actual data from the state machine
   angular.extend($scope, {
    markers: {
        thisMarker: {
          lat: 22,
          lng: 43,
          focus: false,
          draggable: false
        }
    },
    center: {
      lat: 42,
      lng: -83,
      zoom: 2
    },
    attributionControl: false,
    defaults: {
        scrollWheelZoom: false,
        tileLayer: 'http://api.tiles.mapbox.com/v3/alanguirand.i04decfa/{z}/{x}/{y}.jpg',
        minZoom: 2,
        maxZoom: 2,
    }

  }); 
    
  $scope.device = null;
  $scope.request = null;
  $scope.response = null;

  $scope.init = function() {
    $scope.stateLogs = [];
    follow($state.params.url);
  };

  $scope.execute = function(action) {
    navigator.execute(action).then(function(result) {
      if (result.noop) {
        return;
      }
		
      var data = result.data;
      var config = result.config;

      $scope.formattedDiff = "";
      $scope.url = config.url;
      $state.params.url = config.url;

      showData(data);
    });
  };
	
  $scope.executeInlineAction = function(action, cb) {
    navigator.execute(action).then(function(result) {
      // Instead of throwing all kinds of errors
      if (result.noop) {
        return;
      }
      cb();
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
  
  var savedStreams = {};
  var showData = function(deviceData) {
    var device = zettaShared.buildDeviceFromData(deviceData);

    if (device.actions && device.actions.length) {
      device.actions = device.actions.map(function(action) {
        action.execute = function() {
          $scope.execute(action);
        };
        return action;
      });
    }

    device.links.forEach(function(link) {
      if (link.rel.indexOf('up') !== -1) {
        var rootUrl = zettaShared.root;

        if (!rootUrl) {
          var parser = document.createElement('a');
          parser.href = link.href;
          rootUrl = parser.protocol + '//' + parser.hostname;
          if (parser.port) {
            rootUrl += ':' + parser.port;
          }
        }
        zettaShared.breadcrumbs = [ { title: 'root', href: rootUrl }, { title: link.title, href: link.href },
          { title: device.properties.name || device.properties.type } ];
      }
    });

    $scope.device = device;

    $scope.logger(device.monitorHref);

    zettaShared.wireUpStreams(device, function() {
      $scope.$apply();
    });
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
      $scope.response = data;
      showData(data);
    });
  };

}]);
