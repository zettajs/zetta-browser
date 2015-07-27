angular.module('zetta').directive('sparkline', ['$compile', function($compile) {
  function link(scope, element, attrs) {
    scope.$watchCollection('stream', function() {

      // Nothing in the stream; do nothing
      if(!scope.stream || scope.stream.length == 0) return;
      
      stream = scope.stream.map(function(item){
        return {'x': parseInt(item[0].getTime()), 'y': item[1]};
      });

      var x = d3.time.scale().range([0, element.parent()[0].clientWidth]);
      var y = d3.scale.linear().range([scope.height-6, 0]);

      x.domain(d3.extent(stream, function(d) {return d.x}));
      y.domain(d3.extent(stream, function(d) {return d.y}));

      scope.line = d3.svg.line()
          .x(function(d) {return x(d.x);})
          .y(function(d) {return y(d.y) + 3;});

      var d = scope.line(stream);

      if (d) { element.find('path').attr({"d": d}); }

    });
  }

  return {
    restrict: 'E',
    scope: {
      stream: '=',
      width: '=',
      height: '='
    },
    templateUrl: 'partials/sparkline.html',
    link: link
  };
}])

