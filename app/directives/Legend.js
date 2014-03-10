define([
  'app',
  'esri/dijit/Legend'
], function (app, Legend) {
  app.directive('esriLegend', function($document){
    // this object will tell angular how our directive behaves
    return {
      //run last
      priority: -10,
      scope:{},
      replace: true,
      // require the esriMap controller
      // you can access these controllers in the link function
      require: ["^esriMap"],

      // now we can link our directive to the scope, but we can also add it to the map..
      link: function(scope, element, attrs, controllers){
        // controllers is now an array of the controllers from the 'require' option
        var mapController = controllers[0];
        var target = attrs.targetId || $document[0].body;
        var map = mapController.getMap();
        var legend = new Legend({
            map: map,
            layerInfos: mapController.layerInfos
        }, target);
        legend.startup();
        scope.layers = legend.layers;
        for(var i=0;i<scope.layers.length;i++){
            scope.$watch("layers["+i+"].renderer",function(){legend.refresh();});
        }
      }
    };
  });
});