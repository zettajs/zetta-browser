angular.module('zetta').directive('zettaAdvancedQuery', [function() {
  function link(scope, element) {
    var emptyFilter = function() {
      return {
        field: null,
        operator: 'eq',
        value: null
      }
    };

    scope.filters = [emptyFilter()];

    scope.addNewFilter = function() {
      scope.filters.push(emptyFilter());
    };

    scope.removeFilter = function(i) {
      scope.filters.splice(i, 1);
      if (scope.filters.length === 0) {
        scope.addNewFilter();
      }
    };

    scope.performQuery = function() {
      var filters = scope.filters.filter(function(filter) {
        return !!filter.field;
      });
      console.log(filters);

      if (filters.length) {
        console.log(scope.setQueryFilters);
        scope.setQueryFilters(filters);
        scope.submit();
      }
    };
  }

  return {
    restrict: 'E',
    scope: {
      dismiss: '&',
      submit: '&',
      setQueryFilters: '='
    },
    templateUrl: 'partials/advanced-query.html',
    link: link
  };
}]);
