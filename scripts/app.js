angular.module('zetta',
    ['siren', 'ui.state', 'rt.encodeuri', 'angular-responsive'])
.config(['classRouterProvider', '$stateProvider',
    function(classRouterProvider, $stateProvider) {

  classRouterProvider
    .when(['root'], 'overview')
    .when(['server'], 'overview')
    .otherwise('device');

  $stateProvider
    .state('index', {
      url: '',
      templateUrl: 'partials/start.html',
      controller: 'MainCtrl'
    })
    .state('overview', {
      url: '/overview?url',
      templateUrl: 'partials/overview.html',
      controller: 'OverviewCtrl'
    })
    .state('device', {
      url: '/device?url',
      templateUrl: 'partials/device.html',
      controller: 'DeviceCtrl'
    });
  }
])
.factory('appState', function() {
  return { url: '' };
});
