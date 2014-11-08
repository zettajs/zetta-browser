angular.module('zetta').directive('zettaOverviewAction', [function() {
  var link = function(scope, element) {
    
    function isRadioButtons(action) {
        scope.device.name = scope.device.name ?  scope.device.name : scope.device.type
        console.log('devProps', scope.device.name);
      // one input plus hidden
      if (scope.action.fields.length !== 2) {
        return false;
      }

      if (scope.action.fields[0].type !== 'radio' && scope.action.fields[1].type !== 'radio') {
        return false;
      }

      var radio = scope.action.fields.filter(function(field) {
        return field.type === 'radio';
      })[0];

      return radio.value.length < 3;
    }

    if (isRadioButtons(scope.action)) {
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
      scope.action.renderOptionsAsRadioButtons = true;
    } else {

      if (scope.action.fields.length > 2) {
        scope.action.renderOptionsAsMultipleInputs = true;
      } else {
        scope.action.renderOptionsAsButton = true;
      }

      scope.action.inputFields = scope.action.fields; // create copy so mutations dont show up in api response section
      scope.action.inputFields.forEach(function(field, i) {
        if (!field.type) {
          field.type = 'text';
        }

        field.isHidden = (field.type === 'hidden') ? true : false;

        if (field.type === 'radio') {
          field.options = field.value;
          field.value = '';
        }

        // When no value is set, set as empty string.
        if (field.value === undefined) {
          field.value = '';
        }
      });
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
      action: '=value',
      context: '=',
      device: '='
    },
    templateUrl: 'partials/overview-action.html',
    link: link
  };
}]);
