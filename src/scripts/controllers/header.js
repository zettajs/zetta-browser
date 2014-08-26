angular.module('zetta').controller('HeaderCtrl', [
  '$scope', '$state', '$http', 'navigator', 'zettaShared', function($scope, $state, $http, navigator, zettaShared) {

    $scope.shared = zettaShared.state;
    $scope.servers = $scope.shared.servers;
    $scope.breadcrumbs = $scope.shared.breadcrumbs;
    $scope.follow = function(url, filter) {
      url = url || $scope.shared.root;
      var params = { url: url };

      if (filter) {
        $state.params.url = $scope.shared.root;
        params.filter = filter;
      }

      navigator.transitionTo(url, params);
    }

    $scope.$watchCollection('shared', function() { 
      $scope.breadcrumbs = $scope.shared.breadcrumbs;
    });
}]);
