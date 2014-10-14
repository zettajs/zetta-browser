angular.module('zetta').directive('zettaOverviewAction', [function() {
  var link = function(scope, element) {

    if (scope.action.fields) {
      if (scope.action.fields.length === 2
          && (scope.action.fields[0].type === 'radio' || scope.action.fields[1].type === 'radio')) {
        var radio = scope.action.fields.filter(function(field) {
          return field.type === 'radio';
        })[0];

        scope.action.radioField = {
          name: radio.name,
          value: radio.value
        };

        scope.action.radioField.value.forEach(function(val) {
          val.execute = function() {
            radio.value = val.value;
            scope.execute();
          };
        });
        scope.action.renderOptionsAsButtons = true;
      } else {
        scope.action.renderOptionsAsButtons = false;
        scope.action.fields.forEach(function(field, i) {
          if (!field.type) {
            scope.action.fields[i].type = 'text';
          }

          // When no value is set, set as empty string.
          if (field.value === undefined) {
            field.value = '';
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
