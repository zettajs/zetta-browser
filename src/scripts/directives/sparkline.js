angular.module('zetta').directive('sparkline', ['$compile', function($compile) {
  function link(scope, element, attrs) {
    scope.$watchCollection('stream', function() {
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

      
      var mm = {
        raw: d3.extent(stream.map(function(point){return point.y})),
        min: null,
        max: null,
        val: stream[stream.length-1]
      }
      
      stream.forEach(function(point){
        if(mm.min == null && point.y == mm.raw[0]){
          mm.min = point;
        }
        else if(mm.max == null && point.y == mm.raw[1]){
           mm.max = point;
        }
      });
      
      //console.log(x(mm.max.x));
      
      if (d) {
        
       angular.element(element[0].querySelector('.dataline')).attr({"d": d});
       angular.element(element[0].querySelector('.min')).attr({
        "cx": x(mm.min.x),
        "cy": y(mm.min.y) + 3
       });
       angular.element(element[0].querySelector('.max')).attr({
        "cx": x(mm.max.x),
        "cy": y(mm.max.y) + 3
       });
       angular.element(element[0].querySelector('.val')).attr({
        "cx": x(mm.val.x),
        "cy": y(mm.val.y) + 3
       });
        
      }
      
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

