angular.module('zetta').directive('actionField', [function() {
  var link = function(scope, element) {

    console.log('action-field element: ', element.type);
    scope.execute = function() {
      //something something, save value as new placeholder?
    };
  };

  return {
    restrict: 'E',
    scope: {
      self: '=value'
    },
    templateUrl: function(elem, attr){
        console.log('action-field attr:', attr.type);
        return 'partials/fields/default.html';
    },
    link: link
  };
}]);
