$( document ).ready(function() {

  var source, selectedInstrument, map;
  var geoJson = [];
  var visibleCount = $('#visibleCount');

  var config = {
    apiKey: "AIzaSyBFeEzLC7tH2fyEhSXEjA6LxEkfVlFtvXY",
    authDomain: "samplehub-25c4d.firebaseapp.com",
    databaseURL: "https://samplehub-25c4d.firebaseio.com",
    projectId: "samplehub-25c4d",
    storageBucket: "samplehub-25c4d.appspot.com",
    messagingSenderId: "529323641154"
  };

  firebase.initializeApp(config);

  mapboxgl.accessToken = 'pk.eyJ1IjoibWVlbnRhIiwiYSI6ImNqYnF0eTFoMjA4NGsycHVmbGhpejlzdWIifQ.AevFzpm12KxqAmBZY0rnDw';

  map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/streets-v8',
    center: [ -97.0821, 37.6799 ],
    zoom: 4.26
  });

  map.on('load', function() {
    var fb = firebase.database();
    var ref = fb.ref('instrument');

    map.addControl(new MapboxGeocoder({
      accessToken: mapboxgl.accessToken
    }));

    // Change the cursor to a pointer when the mouse is over the places layer.
    map.on('mouseenter', 'places', function () {
      map.getCanvas().style.cursor = 'pointer';
    });

    // Change it back to a pointer when it leaves.
    map.on('mouseleave', 'places', function () {
      map.getCanvas().style.cursor = '';
    });

    var countInstruments = function() {
      var features = map.queryRenderedFeatures({ layers: ['instruments'] });
      visibleCount.text('Visible Instruments: ' + features.length);
    }

    map.on('zoomend', function(e) {
      countInstruments();
    });

    map.on('dragend', function(e) {
      countInstruments();
    });

    $('.btnZoomOut').on('click', function() {
      map.flyTo({center: [ -97.0821, 37.6799 ], zoom: 2 });
    });

    ref.on('value', function(snap) {
      var geoJson = [];
      _.each(snap.val(), function(result) {
        if (result.location) {
          var pnt = {
            'type': "Feature",
            'properties': {
              'description': "<strong>A Little Night Music</strong><p>The Arlington Players' production of Stephen Sondheim's  <a href=\"http://www.thearlingtonplayers.org/drupal-6.20/node/4661/show\" target=\"_blank\" title=\"Opens in a new window\"><em>A Little Night Music</em></a> comes to the Kogod Cradle at The Mead Center for American Theater (1101 6th Street SW) this weekend and next. 8:00 p.m.</p>",
              'icon': "marker",
              'organization': result.address.organization,
              'instrument': result
            },
            'geometry': {
              'type': "Point",
              'coordinates': [ result.location.lng, result.location.lat ]
            }
          }
          geoJson.push(pnt);
        } else {
          console.log(result.address.organization, result.equipment.name, result.address);
        }
      });

      var layer =  {
        id: "instruments",
        type: "symbol",
        source: {
          type: "geojson",
          data: {
            type: "FeatureCollection",
            features: geoJson
          }
        },
        "layout": {
          "icon-image": "{icon}-15",
          "text-field": "{organization}",
          "text-offset": [0, 3],
          "text-size": 10,
          "icon-allow-overlap": true
        }
      };

      map.addLayer(layer);

      visibleCount.text('Total Instruments: ' + geoJson.length);

      map.on('click', 'instruments', function (e) {
        var instrument = JSON.parse(e.features[0].properties.instrument);
        var html = "<b>" + instrument.address.organization + '</b><br>' + instrument.equipment.name + '<br>' + instrument.address.city + ', ' + instrument.address.state;
        new mapboxgl.Popup()
        .setLngLat(e.lngLat)
        .setHTML(html)
        .addTo(map);
      });

    });
  });

});
