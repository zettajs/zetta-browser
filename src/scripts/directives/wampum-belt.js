angular.module('zetta').directive('zettaWampumBelt', ['$compile', 'zettaShared', 
  function($compile, zettaShared) {

  $('#wampum').on('dblclick', function() { $('#wampum').hide(); });

  function textToColor(text, min, max) {
    if (!min) {
      min = 0;
    }

    if (!max) {
      max = 360;
    }

    var tryFloat = parseFloat(text);
    if (typeof text !== 'number' && isNaN(tryFloat)) {
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

  var UNIT_SIZE = 6;

  function drawCanvas(context, colors, cb) {
    var unitWidth = context.canvas.width / 36;
    var transitionWidth = unitWidth;
    var x = context.canvas.width - unitWidth;
    var y = 0;
    var width = unitWidth;
    var height = UNIT_SIZE;//context.canvas.height;

    colors.forEach(function(row) {
      row.forEach(function(color) {
        var w = width;

        context.fillStyle = 'hsl(' + color.hue + ', ' + color.saturation + ', 50%)';
        context.fillRect(x, y, w, height);
        x = x - unitWidth;
      });

      y = y + height;
      x = context.canvas.width - unitWidth;

      $('.page_content header').css('padding-top', $('#wampum canvas').height());
    });

    if (cb) cb();
  }

  function link(scope, element, attrs) {
    var canvas = element.children()[0];
    canvas.height = 0;
    var context = canvas.getContext('2d');

    function getColor(stream) {
      return {
        hue: textToColor(stream.current),
        saturation: textToSaturation(stream.name),
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

    var streams = [];
    var addedHrefs = [];
    scope.$watchCollection('servers', function() {
      scope.servers.forEach(function(server, i) {
        scope.$watchCollection('servers[' + i + '].devices', function() {
          if (!scope.servers[i].devices) {
            return;
          }
          scope.servers[i].devices.forEach(function(device, j) {
            scope.$watchCollection('servers[' + i + '].devices[' + j + '].streams', function() {
              var s = scope.servers[i].devices[j].streams;
              s.forEach(function(stream, k) {
                if (addedHrefs.indexOf(stream.href) !== -1) {
                  return;
                }
                streams.push(stream);
                addedHrefs.push(stream.href);
                update();

                var oldMessage;
                if (stream.socket.onmessage) {
                  oldMessage = stream.socket.onmessage;
                }

                stream.socket.onmessage = function(d) {
                  if (oldMessage) {
                    oldMessage(d);
                  }

                  var stream = scope.servers[i].devices[j].streams[k];
                  var colorIndex = null;

                  streams.forEach(function(s, index) {
                    if (s.href === stream.href) {
                      colorIndex = index;
                    }
                  });

                  if (colorIndex === null) {
                    return;
                  }

                  var d = stream.data;
                  if (d.length === 0) {
                    return;
                  }
                  var arr = d[d.length - 1];

                  var last;
                  if (stream.type === 'categorical') {
                    last = getColor(stream);
                  } else {
                    last = getStreamColor(arr[1], stream.min, stream.max);
                  }

                  colors[colorIndex].unshift(last);
                };

                /*scope.$watchCollection('servers[' + i + '].devices[' + j + '].streams[' + k + '].data', function() {
                  var stream = scope.servers[i].devices[j].streams[k];
                  var colorIndex;

                  streams.forEach(function(s, index) {
                    if (s.href === stream.href) {
                      colorIndex = index;
                    }
                  });

                  if (!colorIndex) {
                    return;
                  }

                  var d = stream.data;
                  if (d.length === 0) {
                    return;
                  }
                  var arr = d[d.length - 1];
                  //var c = { hue: (Math.abs(arr[1].toFixed(0) % 360)), saturation: '100%' };
                  var c = getStreamColor(arr[1], stream.min, stream.max);
                  colors[colorIndex].unshift(c);
                });*/
              });

            });
          });
        });
      });
    });

    var colors = [];
    var unitSize = UNIT_SIZE;

    window.onresize = function() {
      canvas.width = window.innerWidth;//unitSize * 36;
      canvas.height = streams.length * unitSize;
      context.fillStyle = 'rgb(222, 222, 222)';
      context.fillRect(0, 0, canvas.width, canvas.height);
      drawCanvas(context, colors);
    };

    var update = function() {
      if (streams.length === 0) {
        return;
      }

      canvas.width = window.innerWidth;//unitSize * 36;
      canvas.height = streams.length * unitSize;
      context.fillStyle = 'rgb(222, 222, 222)';
      context.fillRect(0, 0, canvas.width, canvas.height);

      angular.forEach(streams, function(stream, i) {
        var last = getStreamColor(stream);
        colors[i] = colors[i] || [];
        colors[i].push(last);
      });
    };

    update();
    
    var interval = setInterval(function() {
      streams.forEach(function(stream, i) {
        var last;
        if (stream.type === 'categorical') {
          last = getColor(stream);
        } else {
          last = getStreamColor(stream.current, stream.min, stream.max);
        }

        colors[i] = colors[i] || [];
        colors[i].unshift(last);
        colors[i] = colors[i].slice(0, 49);
      });

      drawCanvas(context, colors);
    }, 50);
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

