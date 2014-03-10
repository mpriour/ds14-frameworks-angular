define([
  'app',
  'esri/layers/FeatureLayer'
], function (app, FeatureLayer) {
  app.directive('esriFeatureLayer', ['$parse', function($parse){
    // this object will tell angular how our directive behaves
    return {
      // only allow esriFeatureLayer to be used as an element (<esri-feature-layer>)
      restrict: 'E',

      // require the esriFeatureLayer to have its own controller as well an esriMap controller
      // you can access these controllers in the link function
      require: ["esriFeatureLayer", "^esriMap"],

      // replace this element with our template.
      // since we aren't declaring a template this essentially destroys the element
      replace: true,

      // define an interface for working with this directive
      controller: function($scope, $element, $attrs){

        // now is a good time to declare our FeatureLayer
        var options = $parse($attrs.options)() || {};
        if(options && options.mode){
          var modes = {'ondemand':FeatureLayer.MODE_ONDEMAND,'snapshot':FeatureLayer.MODE_SNAPSHOT,'selection':FeatureLayer.MODE_SELECTION};
          options.mode = modes[options.mode];
        }
        var layer = new FeatureLayer($attrs.url, options);

        // lets expose a function to get the layer
        this.getLayer = function(){
          return layer;
        };

        //expose all important native & non-native events which don't have a type in the event properties
        //listen for events and expose them as broadcasts on the scope and use the scope's handler (if any)
        var getEventBubbler = function(etype){
          return function(evt){
            etype = (evt && evt.type && evt.srcElement) ? evt.type : etype;
            // emit a message that bubbles up scopes, listen for it on your scope
            $scope.$emit('layer.' + etype, evt);

            // use the scope's event handling function to handle the event if present
            if($scope[etype]){
              $scope.$apply(function(){
                $scope[etype].call($scope, evt);
              });
            }
          };
        };
        var nativeEvents = ['click', 'dbl-click','mouse-move', 'mouse-out', 'mouse-over', 'double-tap', 'tap'];
        var classEvents = ['load', 'error', 'edits-complete', 'graphic-add', 'graphic-remove',
           'resume', 'suspend', 'update-start', 'update-end'];
        angular.forEach(nativeEvents.concat(classEvents),function(etype){
          layer.on(etype, getEventBubbler(etype));
        });
      },

      // now we can link our directive to the scope, but we can also add it to the map..
      link: function(scope, element, attrs, controllers){
        // controllers is now an array of the controllers from the 'require' option
        var layerController = controllers[0];
        var mapController = controllers[1];

        // now we can use the 'addLayer' method exposed on the controller
        // of the esriMap directive to add the layer to the map
        var lyr = layerController.getLayer();
        mapController.addLayer(lyr);

        //look for layerInfo related attributes. Add them to the map's layerInfos array for access in other components
        mapController.addLayerInfo({
          title: attrs.title || lyr.name,
          layer: lyr,
          hideLayers: (attrs.hideLayers) ? attrs.hideLayers.split(',') : undefined,
          defaultSymbol: (attrs.defaultSymbol) ? JSON.parse(attrs.defaultSymbol) : true
        });
      }
    };
  }]);
});