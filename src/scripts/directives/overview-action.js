angular.module('zetta').directive('zettaOverviewAction', [function() {
  var link = function(scope, element) {
    if (scope.action.fields) {
      if (scope.action.fields.length === 1 && scope.action.fields[0].type === 'radio') {
        scope.action.renderOptionsAsButtons = true;
      } else {
        scope.action.renderOptionsAsButtons = false;
        scope.action.fields.forEach(function(field, i) {
          if (!field.type) {
            scope.action.fields[i].type = 'text';
          }
        });
      }
    }

    scope.execute = function() {
      var button = $('.' + scope.action.name + '-button', element);

      button.addClass('loading');
      scope.action.execute();
      button.removeClass('loading');
      button.addClass('success');
      setTimeout(function() {
        button.removeClass('success');
      }, 1000);
    };
  };

  return {
    restrict: 'E',
    scope: {
      action: '=value'
    },
    templateUrl: 'partials/overview-action.html',
    link: link
  };
}]);

