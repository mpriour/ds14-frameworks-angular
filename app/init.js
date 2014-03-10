require([
  'angular',
  'app',
  'app/controllers/MapCtrl',
  'app/directives/Map',
  'app/directives/FeatureLayer',
  'app/directives/Legend'
], function(angular) {
  angular.bootstrap(document.body, ['app']);
});