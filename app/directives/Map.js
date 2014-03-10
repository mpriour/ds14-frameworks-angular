define([
  'app',
  'esri/map',
  'esri/geometry/Point',
  'esri/geometry/Extent'
], function(app, Map, Point, Extent) {

  // register a new directive called esriMap with our app
  app.directive('esriMap', ['$parse', function($parse) {
    // this object will tell angular how our directive behaves
    return {
      // only allow esriMap to be used as an element (<esri-map>)
      restrict: 'E',

      // this directive shares $scope with its parent (this is the default)
      scope: false,

      // define how our template is compiled this gets the $element our directive is on as well as its attributes ($attrs)
      compile: function($element, $attrs) {
        // remove the id attribute from the main element
        $element.removeAttr("id");

        // append a new div inside this element, this is where we will create our map
        $element.append("<div id=" + $attrs.id + "></div>");

        // since we are using compile we need to return our linker function
        // the 'link' function handles how our directive responds to changes in $scope
        return function(scope, element, attrs, controller) {
          scope.$watch("center", function(newCenter, oldCenter) {
            if (newCenter !== oldCenter) {
              controller.centerAt(newCenter);
            }
          });
        };
      },

      // even though $scope is shared we can declare a controller for manipulating this directive
      // this is great for when you need to expose an API for manipulaiting your directive
      // this is also the best place to setup our map
      controller: function($scope, $element, $attrs) {
        // setup our map options based on the attributes and scope
        var mapOptions = {
          center: ($attrs.center) ? $attrs.center.split(",") : $scope.center,
          zoom: ($attrs.zoom) ? $attrs.zoom : $scope.zoom,
          basemap: ($attrs.basemap) ? $attrs.basemap : $scope.basemap,
          extent: ($attrs.extent) ? $attrs.extent : $scope.extent
        };

        //extent takes precedence over center/zoom. remove those options to avoid conflicts if extent provided
        //extent is 5 member array (xmin, ymin, xmax, ymax, srid); ignore if it doesn't look right.
        if(mapOptions.extent){
          var moext = mapOptions.extent.split(',');
          if(moext.length == 5){
            var extent = new Extent({
              xmin: +moext[0], ymin: +moext[1], xmax: +moext[2], ymax: +moext[3], spatialReference: {wkid: +moext[4]}
            });
            mapOptions.extent = extent;
            delete mapOptions.center; delete mapOptions.zoom;
          }
        }

        //extended mapOptions - exposed as the options attribute
        mapOptions = angular.extend(mapOptions, $parse($attrs.options)());

        // declare our map
        var map = new Map($attrs.id, mapOptions);

        // start exposing an API by setting properties on "this" which is our controller
        // lets expose the "addLayer" method so child directives can add themselves to the map
        this.addLayer = function(layer) {
          return map.addLayer(layer);
        };

        // lets expose a version of centerAt that takes an array of [lng,lat]
        this.centerAt = function(center) {
          var point = new Point({
            x: +center[0],
            y: +center[1],
            spatialReference: {
              wkid: 102100
            }
          });

          map.centerAt(point);
        };

        this.getMap = function(){
          return map;
        };

        this.addLayerInfo = function(lyrInfo){
          if(!this.layerInfos){
            this.layerInfos = [lyrInfo];
          } else {
            this.layerInfos.push(lyrInfo);
          }
        };

        this.getLayerInfos = function(){
          return this.layerInfos;
        };

        //expose all important native & non-native events which don't have a type in the event properties
        //listen for events and expose them as broadcasts on the scope and use the scope's handler (if any)
        var getEventBubbler = function(etype){
          return function(evt){
            etype = (evt && evt.type && evt.srcElement) ? evt.type : etype;
            // emit a message that bubbles up scopes, listen for it on your scope
            $scope.$emit('map.' + etype, evt);

            // use the scope's event handling function to handle the event if present
            if($scope[etype]){
              $scope.$apply(function(){
                $scope[etype].call($scope, evt);
              });
            }
          };
        };
        var nativeEvents = ['click', 'dbl-click', 'key-down', 'key-up', 'mouse-move', 'mouse-out', 'mouse-over',
           'double-tap', 'pinch-end', 'pinch-startswipe-end', 'swipe-start', 'tap', 'two-finger-tap'];
        var classEvents = ['load','layer-add','layer-remove','extent-change','resize','unload',
           'time-extent-change','update-start','update-end'];
        angular.forEach(nativeEvents.concat(classEvents),function(etype){
          map.on(etype, getEventBubbler(etype));
        });
      }
    };
  }]);
});