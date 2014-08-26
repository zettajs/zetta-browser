angular.module('zetta').controller('HeaderCtrl', [
  '$scope', '$state', '$http', 'navigator', 'zettaShared', function($scope, $state, $http, navigator, zettaShared) {

    $scope.shared = zettaShared.state;
    $scope.servers = $scope.shared.servers;
    $scope.breadcrumbs = $scope.shared.breadcrumbs;
    $scope.follow = function(url) {
      url = url || $scope.shared.root;
      navigator.transitionTo(url, { url: url });
    }

    $scope.$watchCollection('shared', function() { 
      $scope.breadcrumbs = $scope.shared.breadcrumbs;
    });
}]);
