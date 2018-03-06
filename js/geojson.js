//Leaflet Lab - Nathalia Roberts

/* USMedianRent_point.geojson */

$(document).ready(createMap);

//Remove map-description so map takes full page
$(document).ready(function(){
  $( 'header' ).click(function( event ) {
  event.preventDefault();
  $( this ).hide( "slow" );
});

});

//function to instantiate the Leaflet map
function createMap(){
    //create the map
    var map = L.map('mapid', {
        center: [39.005498, -96.332020], // centers on the US
        zoom: 5
    });

    L.tileLayer('https://api.mapbox.com/styles/v1/njroberts/cje9kcruv1hkq2rlmm35m56xx/tiles/256/{z}/{x}/{y}?access_token=pk.eyJ1Ijoibmpyb2JlcnRzIiwiYSI6ImNqNzExcWxsZDAwZWYyd213cWtibGN2cTkifQ.HjVFYKPHguKbs5nZCqL_dg', {
        attribution: '&copy; <a href="http://www.mapbox.com">Mapbox</a>'
    }).addTo(map);

    //call getData function
    getData(map);


};


//Import GeoJSON data using ajax and JQuery
function getData(map){
    //load the data
    $.ajax("data/USMedianRent_point_2018.geojson", {
        dataType: "json",
        success: function(response){

          //create an attributes array
          var attributes = processData(response);

          //call function to create proportional symbols
          createPropSymbols(response, map, attributes);
          //sequence control test
          createSequenceControls(map, attributes);
          // call create legend
          createLegend(map,attributes);
          // 5th operator doens't work
          filterButtons(response, map, attributes);
        }
    });
};



//Above Example 3.8...Step 3: build an attributes array from the data
function processData(data){
    //empty array to hold attributes
    var attributes = [];

    //properties of the first feature in the dataset
    var properties = data.features[0].properties;

    //push each attribute name into attributes array
    for (var attribute in properties){
        //only take attributes with population values
        if (attribute.indexOf("Year") > -1){
            attributes.push(attribute);
        };
    };

    //check result

    //console.log(attributes);
    //console.log(properties);
    return attributes;
};



function createPopup(properties, attribute, layer, radius){
  //build popup content string
  var popupContent = "<p><b>State:</b> " + properties.State + "</p>";

  var year = attribute.split("_")[1];
  popupContent += "<p><b> Median Rent in " + year + ":</b> " + "$" + properties[attribute] + " in 2018 USD</p>";

  //bind the popup to the circle marker
     layer.bindPopup(popupContent, {
         offset: new L.Point(0,-radius) // offset for mobile devices
     });
};



//function to convert markers to circle markers
function pointToLayer(feature, latlng, attributes){
    //Assign the current attribute based on the first index of the attributes array
    var attribute = attributes[0];
    //check
    //console.log(attribute);

    //create marker options
    var options = {
        fillColor: "#1c2f52",
        color: "#000",
        weight: 1,
        opacity: 1,
        fillOpacity: 0.8
    };

    //For each feature, determine its value for the selected attribute
    var attValue = Number(feature.properties[attribute]);

    //Give each feature's circle marker a radius based on its attribute value
    options.radius = calcPropRadius(attValue);

    //create circle marker layer
    var layer = L.circleMarker(latlng, options);

    //Example 1.1 line 2...in pointToLayer()
     createPopup(feature.properties, attribute, layer, options.radius);

    // Example to add tooltips using event listeners for circle markers
    //event listeners to open popup on hover
    layer.on({
        mouseover: function(){
            this.openPopup();
        },
        mouseout: function(){
            this.closePopup();
        }
    });

    //return the circle marker to the L.geoJson pointToLayer option
    return layer;
};


function filterButtons(data, map, attributes){
  //Testing mapbox filter function - can't get to work
//===============================================================

//create a Leaflet GeoJSON layer and add it to the map
L.geoJson(data, {
    pointToLayer: function(feature, latlng){
        return pointToLayer(feature, latlng, attributes);
    }

})//.addTo(map);


   //console.log(attributes);
   var attribute = attributes[0];
   //console.log(attribute);


  $('.menu-ui a').on('click', function() {
         //For each filter link, get the 'data-filter' attribute value.
        var filter = $(this).data('filter');
        $(this).addClass('active').siblings().removeClass('active');

        data.setFilter(function(f) {
            // If the data-filter attribute is set to "all", return
            // all (true). Otherwise, filter on markers that have
            // a value set to true based on the filter name.
            return (filter === 'all') ? true : f.properties[filter] === true;
        });
        updatePropSymbols(map, attributes[index]);
        console.log( "Line 167");

        return false;


    });

//=================================================================

};


//Add circle markers for point features to the map
//uses anonymous function to call pointToLayer and pass array for sequence
function createPropSymbols(data, map, attributes){
    //create a Leaflet GeoJSON layer and add it to the map
    L.geoJson(data, {
        pointToLayer: function(feature, latlng){
            return pointToLayer(feature, latlng, attributes);
        }

    }).addTo(map);

};


function updatePropSymbols(map, attribute){
    map.eachLayer(function(layer){
        if (layer.feature && layer.feature.properties[attribute]){
          //access feature properties
          var props = layer.feature.properties;

          //update each feature's radius based on new attribute values
           var radius = calcPropRadius(props[attribute]);
           layer.setRadius(radius);

           //call createPopup
           createPopup(props, attribute, layer, radius);
           // Call to update Legend
            updateLegend(map, attribute);

        };
    });
};


//calculate the radius of each proportional symbol
function calcPropRadius(attValue) {
   //scale factor to adjust symbol size evenly
   var scaleFactor = 2;
   //area based on attribute value and scale factor
   var area = attValue * scaleFactor;
   //radius calculated based on area
   var radius = Math.sqrt(area/Math.PI);

   return radius;
};


function createSequenceControls(map, attributes){
  var SequenceControl = L.Control.extend({
        options: {
            position: 'bottomleft'
        },

        onAdd: function (map) {
            // create the control container div with a particular class name
            var container = L.DomUtil.create('div', 'sequence-control-container');

           //create range input element (slider)
          $(container).append('<input class="range-slider" type="range">');

          //add skip buttons
          $(container).append('<button class="skip" id="reverse">Reverse</button>');
          $(container).append('<button class="skip" id="forward">Skip</button>');

        //kill any mouse event listeners on the map
          $(container).on('mousedown dblclick', function(e){
                L.DomEvent.stopPropagation(e);

            });

            return container;
        }
    });

    map.addControl(new SequenceControl());

   //replace button content with images
  $('#reverse').html('<img src="img/reverse.png">');
  $('#forward').html('<img src="img/forward.png">');


    //set slider attributes
   $('.range-slider').attr({
       max: 6,
       min: 0,
       value: 0,
       step: 1
   });


      // click listener for buttons
      $('.skip').click(function(){
          //sequence
           //get the old index value
          var index = $('.range-slider').val();

          //Step 6: increment or decrement depending on button clicked
          if ($(this).attr('id') == 'forward'){
              index++;
              //Step 7: if past the last attribute, wrap around to first attribute
              index = index > 6 ? 0 : index;
          } else if ($(this).attr('id') == 'reverse'){
              index--;
              //Step 7: if past the first attribute, wrap around to last attribute
              index = index < 0 ? 6 : index;
          };

          // update slider
          $('.range-slider').val(index);

         updatePropSymbols(map, attributes[index]);


      });

      //Step 5: input listener for slider
      $('.range-slider').on('input', function(){
          //sequence
          //Step 6: get the new index value
          var index = $(this).val();

           //Called in both skip button and slider event listener handlers
          // pass new attribute to update symbols
          updatePropSymbols(map, attributes[index]);


      });

};


function createLegend(map, attributes){
    var LegendControl = L.Control.extend({
        options: {
            position: 'bottomright'
        },

        onAdd: function (map) {
            // create the control container with a particular class name
            var container = L.DomUtil.create('div', 'legend-control-container');

             //add temporal legend div to container
            $(container).append('<div id="temporal-legend">')

            //Step 1: start attribute legend svg string
    var svg = '<svg id="attribute-legend" width="250px" height="70px">';

        //Example 3.5 line 15...Step 1: start attribute legend svg string

          //object to base loop on...replaces Example 3.10 line 1
        var circles = {
            max: 20,
            mean: 40,
            min: 60
        };

       //loop to add each circle and text to svg string
        for (var circle in circles){

            //circle string
            svg += '<circle class="legend-circle" id="' + circle +
            '" fill="#1c2f52" fill-opacity="0.6" stroke="#000000" cx="30"/>';

        //text string
        svg += '<text id="' + circle + '-text" x="65" y="' + circles[circle] + '"></text>';

        };

        //close svg string
        svg += "</svg>";

        //add attribute legend svg to container
        $(container).append(svg);

            return container;
        }
    });

    map.addControl(new LegendControl());

    updateLegend(map, attributes[0]);
};

//Calculate the max, mean, and min values for a given attribute
function getCircleValues(map, attribute){
    //start with min at highest possible and max at lowest possible number
    var min = Infinity,
        max = -Infinity;

    map.eachLayer(function(layer){
        //get the attribute value
        if (layer.feature){
            var attributeValue = Number(layer.feature.properties[attribute]);

            //test for min
            if (attributeValue < min){
                min = attributeValue;
            };

            //test for max
            if (attributeValue > max){
                max = attributeValue;
            };
        };
    });

    //set mean
    var mean = (max + min) / 2;

    //return values as an object
    return {
        max: max,
        mean: mean,
        min: min
    };
};



//Update the legend with new attribute
function updateLegend(map, attribute){
    //create content for legend
    var year = attribute.split("_")[1];
    var content = "<b>Median Rent in </b>" + year;

    //replace legend content
    $('#temporal-legend').html(content);

    //get the max, mean, and min values as an object
    var circleValues = getCircleValues(map, attribute);


     for (var key in circleValues){
        //get the radius
        var radius = calcPropRadius(circleValues[key]);

        //Step 3: assign the cy and r attributes
        $('#'+key).attr({
            cy: 59 - radius,
            r: radius
        });

     //Step 4: add legend text
        $('#'+key+'-text').text(Math.round(circleValues[key]*100)/100 + " in 2018 ($) Dollars");

    };
};
