angular.module('zetta').controller('DeviceCtrl', [
  '$scope', '$state', '$http', 'navigator', function($scope, $state, $http, navigator) {
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
        etime = d.timestamp -  $scope.stateLogs[$scope.stateLogs.length -1].time.time;
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
  
  var showData = function(deviceData) {
    if (typeof deviceData === 'string') {
      deviceData = JSON.parse(deviceData);
    }

    var device = {
      properties: deviceData.properties
    };

    var objectStreamLinks = deviceData.links.filter(function(link) {
      return link.rel.indexOf('http://rels.zettajs.io/object-stream') !== -1;
    });

    if (objectStreamLinks.length) {
      device.streams = [];
    }

    objectStreamLinks.forEach(function(objectStream) {
      if (objectStream.title === 'logs') {
        device.monitorHref = objectStream.href;
      } else {
        var stream = {
          name: objectStream.title,
          href: objectStream.href,
          socket: new WebSocket(objectStream.href),
          data: [],
          min: null,
          max: null,
          type: null,
          current: objectStream.rel.indexOf('monitor') !== -1
                    ? device.properties[objectStream.title] : null,
        };

        stream.type = getAssumedStreamType(stream);
        device.streams.push(stream);
      }
    });

    if (deviceData.actions && deviceData.actions.length) {
      device.actions = deviceData.actions.map(function(action) {
        action.execute = function() {
          $scope.execute(action);
        };
        return action;
      });
    }

    $scope.device = device;

    $scope.logger(device.monitorHref);

    device.streams.forEach(function(stream) {
      stream.socket.onmessage = function(event) {
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

        $scope.$apply();
      }
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

  var getAssumedStreamType = function(stream) {
    return isNaN(parseInt(stream.current))
            ? 'categorical'
            : 'numerical';
  };
}]);
