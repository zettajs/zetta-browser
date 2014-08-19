angular.module('zetta').directive('zettaWampumBelt', ['$compile', function($compile) {
  function textToColor(text, min, max) {
    if (!min) {
      min = 0;
    }

    if (!max) {
      max = 360;
    }

    var tryFloat = parseFloat(text);
    if (typeof text === 'string' && isNaN(tryFloat)) {
      var code = text.toString().split('').map(function(c) {
        return c.charCodeAt(0);
      }).reduce(function(previous, current) {
        return previous + current;
      }, 0);

      return (code % max) - min;
    } else {
      if (tryFloat === max) {
        return 359;
      }

      if (val > 360) {
        val = val % 360;
      }

      var val = (tryFloat - min)/ (max - min);
      return Math.floor(val * 360);
    }
  }

  function textToSaturation(text) {
    var code = text.split('').map(function(c) {
      return c.charCodeAt(0);
    }).reduce(function(previous, current) {
      return previous + current;
    }, 0);

    return ((code * Math.floor(text.length/3)) % 100) + '%';
  }

  var UNIT_SIZE = 10;

  function drawCanvas(context, colors, cb) {
    var unitWidth = context.canvas.width / 36;
    var transitionWidth = unitWidth;
    var x = context.canvas.width - unitWidth;
    var y = 0;
    var width = unitWidth;
    var height = UNIT_SIZE;//context.canvas.height;

    colors.forEach(function(row) {
      row.state.forEach(function(block) {
        var w;

        switch(block.type) {
          case 'transition': 
            w = transitionWidth;
            break;
          case 'state':
            w = width;
            break;
        }

        context.fillStyle = 'hsl(' + block.color.hue + ', ' + block.color.saturation + ', ' + block.color.lightness + ')';
        context.fillRect(x, y, w, height);
        x = x - unitWidth;
      });

      y = y + height;
      x = context.canvas.width - unitWidth;

      if (row.streams.length) {
        row.streams.forEach(function(strm) {
          strm.forEach(function(color) {
            context.fillStyle = 'hsl(' + color.hue + ', ' + color.saturation + ', 50%)';
            //context.fillStyle = 'hsl(' + color.hue + ', 100%, 50%)';
            context.fillRect(x, y, width, height);
            x = x - unitWidth;
          });
          y = y + height;
          x = context.canvas.width - unitWidth;
        });
      }
    });

    if (cb) cb();
  }

  function link(scope, element, attrs) {
    var canvas = element.children()[0];
    var context = canvas.getContext('2d');

    function getColor(entity) {
      return {
        hue: textToColor(entity.raw.state),
        saturation: textToSaturation(entity.raw.id),
        lightness: '50%'
      };
    };

    function getStreamColor(value, min, max) {
      var val = textToColor(value, min, max);
      return {
        hue: val,
        saturation: '100%',
        lightness: '50%'
      };
    }

    function getTransitionColor(transition) {
      return {
        hue: textToColor(transition),
        saturation: '50%',
        lightness: '80%'
      };
    }

    scope.$watchCollection('main.entities', function() {
      if (scope.main.entities.length === 0) {
        return;
      }

      var unitSize = UNIT_SIZE;
      canvas.width = window.innerWidth;//unitSize * 36;
      canvas.height = scope.main.entities.length * unitSize;
      context.fillStyle = 'rgb(222, 222, 222)';
      context.fillRect(0, 0, canvas.width, canvas.height);

      var colors = [];

      window.onresize = function() {
        canvas.width = window.innerWidth;//unitSize * 36;
        canvas.height = scope.main.entities.length * unitSize;
        context.fillStyle = 'rgb(222, 222, 222)';
        context.fillRect(0, 0, canvas.width, canvas.height);
        drawCanvas(context, colors);
      };

      angular.forEach(scope.main.entities, function(entity, i) {
        var last = getColor(entity);
        var block = {
          type: 'state',
          color: last
        };

        colors[i] = {};
        colors[i].state = [];
        colors[i].streams = [];
        colors[i].state.push(block);

        var identifier = 'main.entities[' + i + ']';
        var lastTransitionIdentifier = identifier + '.lastTransition';
        scope.$watch(lastTransitionIdentifier, function() {
          if (scope.main.entities[i].lastTransition === null ||
              scope.main.entities[i].lastTransition === undefined) {
            return;
          }

          var block = {
            type: 'transition',
            color: getTransitionColor(scope.main.entities[i].raw.state)
          };

          colors[i].state.unshift(block);
        });

        var watchedStream = [];

        scope.$watchCollection(identifier, function() {

          var keys = Object.keys(entity.streams);

          if (keys.length === 0) {
            return;
          }

          angular.forEach(keys, function(key) {
            if (watchedStream.indexOf(key) !== -1) {
              return;
            }

            watchedStream.push(key);
            canvas.height += unitSize;
            colors[i].streams.push([]);
            var streamIndex = colors[i].streams.length - 1;

            scope.$watchCollection('main.entities[' + i + '].streams["' + key + '"].data', function() {
              var d = entity.streams[key].data;
              if (d.length === 0) {
                return;
              }
              var arr = d[d.length - 1];
              //var c = { hue: (Math.abs(arr[1].toFixed(0) % 360)), saturation: '100%' };
              var c = getStreamColor(arr[1], entity.streams[key].min, entity.streams[key].max);
              colors[i].streams[streamIndex].unshift(c);
            });
          });
        }, true);
      });
      
      var interval = setInterval(function() {
        angular.forEach(scope.main.entities, function(entity, i) {
          var last = getColor(scope.main.entities[i]);
          var block = {
            type: 'state',
            color: last
          };
          colors[i].state.unshift(block);
          colors[i].state = colors[i].state.slice(0, 49);
          colors[i].streams.forEach(function(strm, j) {
            var streamColors = colors[i].streams[j];
            var last = streamColors[0];

            if (last) {
              colors[i].streams[j].unshift(last);
            }
            colors[i].streams[j] = colors[i].streams[j].slice(0, 49);
          });
        });

        drawCanvas(context, colors);
      }, 50);
    });
  }

  return {
    restrict: 'E',
    scope: {
      servers: '='
    },
    template: '<canvas class="wampum" id="wampum" width="100%"></canvas>',
    link: link
  };
}])

