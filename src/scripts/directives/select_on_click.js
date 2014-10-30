angular.module('zetta').directive('selectOnClick', [function() {
  return function(scope, element, attrs) {
    element.bind('click', function() {
      element[0].select();
    });
  };
}]);
