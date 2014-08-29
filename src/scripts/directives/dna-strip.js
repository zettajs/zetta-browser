angular.module('zetta').directive('zDnaStrip', ['$compile', function($compile) {
  function textToColor(text) {
    if (text === null) {
      return 0;
    }
    var code = text.toString().split('').map(function(c) {
      return c.charCodeAt(0);
    }).reduce(function(previous, current) {
      return previous + current;
    }, 0);

    return code % 360;
  }

  function textToSaturation(text) {
    var code = text.split('').map(function(c) {
      return c.charCodeAt(0);
    }).reduce(function(previous, current) {
      return previous + current;
    }, 0);

    return ((code * Math.floor(text.length/3)) % 100) + '%';
  }

  function drawCanvas(context, colors, cb) {
    var unitWidth = context.canvas.width / 36;
    var x = context.canvas.width - unitWidth;
    var y = 0;
    var width = unitWidth;
    var height = context.canvas.height;

    colors.forEach(function(color) {
      context.fillStyle = 'hsl(' + color.hue + ', ' + color.saturation + ', ' + color.lightness + ')';
      context.fillRect(x, y, width, height);
      x = x - unitWidth;
    });

    if (cb) cb();
  }

  function link(scope, element, attrs) {
    var canvas = element.children()[0];
    var context = canvas.getContext('2d');
    
    //this works, but it hurts. 
    canvas.width = $(canvas).parent().parent().innerWidth();

    context.fillStyle = 'rgb(222, 222, 222)';
    context.fillRect(0, 0, canvas.width, canvas.height);

    var colors = [];
    function getColor(text) {
      return {
        hue: textToColor(text),
        saturation: textToSaturation(scope.stream.name),
        lightness: '50%'
      };
    };

    function getTransitionColor(transition) {
      return {
        hue: textToColor(transition),
        saturation: '50%',
        lightness: '80%'
      };
    }


    var oldMessage;
    if (scope.stream.socket.onmessage) {
      oldMessage = scope.stream.socket.onmessage;
    }

    scope.stream.socket.onmessage = function(d) {
      if (oldMessage) {
        oldMessage(d);
      }

      var data = JSON.parse(d.data);
      var last = getColor(data.data);
      colors.unshift(last);
    };

    var last = getColor(scope.stream.current);
    colors.unshift(last);

    /*var lastTransitionTimer;
    scope.$watch('entity.lastTransition', function() {
      if (scope.entity.lastTransition === null) {
        return;
      }

      colors.unshift(getTransitionColor(scope.entity.current));

      scope.entity.lastTransition = null;
    });*/

    var index = 1;
    var interval = setInterval(function() {
      var last = getColor(scope.stream.current);
      colors.unshift(last);
      if (colors.length > 36) {
        colors = colors.slice(0, 35);
      }
      drawCanvas(context, colors);
    }, 50);
  }

  return {
    restrict: 'E',
    scope: {
      stream: '=',
      height: '='
    },
    templateUrl: 'partials/dna-strip.html',
    link: link
  };
}])

