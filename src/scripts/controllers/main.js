angular.module('zetta').controller('MainCtrl', [
  '$scope', '$state', 'navigator', 'appState', 'zettaShared',
  function($scope, $state, navigator, appState, zettaShared) {
    zettaShared.breadcrumbs = [];
    zettaShared.servers = [];
    zettaShared.pinned = [];
    zettaShared.muted = [];

    $scope.init = function() {
      $scope.params = { url: appState.url || '' };
    };

    $scope.fetchUrl = function(params) {
      if (!params.url) {
        return;
      }
      var url = params.url;
      appState.url = url;

      var index = $scope.serverUrls.indexOf(url);
      if (index > -1) {
        $scope.serverUrls.splice(index, 1);
      }

      $scope.serverUrls.unshift(url);

      localStorage.serverUrls = JSON.stringify($scope.serverUrls);

      navigator.transitionTo(url, { url: url });
    };

    if (!localStorage.serverUrls) {
      localStorage.serverUrls = JSON.stringify([]);
    }

    $scope.serverUrls = JSON.parse(localStorage.serverUrls);
  }
]);
