$( document ).ready(function() {

  var source, selectedInstrument, map;
  var geoJson = [];
  var visibleCount = $('#visibleCount');
  var features = null;
  var geoJsonExtent = null;

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
    style: 'mapbox://styles/mapbox/light-v9',
    center: [ -97.0821, 37.6799 ],
    zoom: 3.4
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

    function fit() {
      if (!geoJsonExtent) geoJsonExtent = geojsonExtent(features);

      if (geoJsonExtent)
        map.fitBounds(geoJsonExtent, { padding: 70 });
    }

    $('.btnZoomOut').on('click', function() {
      fit();
    });

    ref.once('value', function(snap) {

      console.log('Total', _.size(snap.val()));

      _.each(snap.val(), function(result, instrumentId) {
        if (result.location) {
          var pnt = {
            type: 'Feature',
            properties: {
              icon: 'marker',
              organization: result.address.organization,
              instrument: result,
              instrumentId: instrumentId
            },
            geometry: {
              type: 'Point',
              coordinates: [ result.location.lng, result.location.lat ]
            }
          }
          geoJson.push(pnt);
        } else {
          console.log(instrumentId, result.address.organization, result.equipment.name, `https://app.meenta.io/main/lab/${instrumentId}/summary`);
        }
      });

      map.addSource('instrumentData', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: []
        },
        cluster: true,
        clusterMaxZoom: 11,
        clusterRadius: 50
      });

      var source = map.getSource('instrumentData');
      features = { type: 'FeatureCollection', features: geoJson }

      // Set the features
      source.setData(features);

      var layer =  {
        id: 'instruments',
        type: 'symbol',
        source: 'instrumentData',
        // source: {
        //   type: 'geojson',
        //   data: {
        //     type: 'FeatureCollection',
        //     features: geoJson
        //   }
        // },
        layout: {
          'icon-image': '{icon}-15',
          'text-field': '{organization}',
          'text-offset': [ 0, 3 ],
          'text-size': 10,
          'icon-allow-overlap': true
        }
      };

      map.addLayer(layer);

      // Add the background clusters colors.
      map.addLayer({
        id: 'clusters-background',
        type: 'circle',
        source: 'instrumentData',
        filter: [ 'has', 'point_count' ],
        paint: {
          'circle-color': {
            property: 'point_count',
            type: 'interval',
            stops: [
              [ 0, '#fff' ],
              [ 4, '#fff' ],
              [ 6, '#fff' ],
              [ 100, '#fff' ],
              [ 750, '#fff' ],
            ]
          },
          'circle-radius': {
            property: 'point_count',
            type: 'interval',
            stops: [
              [ 0, 22 ],
              [ 4, 27 ],
              [ 6, 32 ],
              [ 100, 42 ],
              [ 750, 52 ]
            ]
          }
        }
      });

      map.addLayer({
        id: 'clusters',
        type: 'circle',
        source: 'instrumentData',
        filter: ['has', 'point_count'],
        paint: {
          'circle-color': {
            property: 'point_count',
            type: 'interval',
            stops: [
              [ 0, '#2977D2' ],
              [ 4, '#3584DF' ],
              [ 6, '#4E9DF8' ],
              [ 100, '#81D0FF' ],
              [ 750, '#9BEAFF' ],
            ]
          },
          'circle-radius': {
            property: 'point_count',
            type: 'interval',
            stops: [
              [ 0, 20 ],
              [ 4, 25 ],
              [ 6, 30 ],
              [ 100, 40 ],
              [ 750, 50 ]
            ]
          }
        }
      });

      // Add in a clustered layer for counts.
      map.addLayer({
        id: 'cluster-count',
        type: 'symbol',
        source: 'instrumentData',
        filter: [ 'has', 'point_count' ],
        layout: {
          'text-field': '{point_count_abbreviated}',
          'text-font': [ 'DIN Offc Pro Medium', 'Arial Unicode MS Bold' ],
          'text-size': 12
        }
      });

      // When we click on a cluster, this will zoom us in.
      map.on('click', 'clusters', function (e) {
        map.flyTo({ center: e.features[0].geometry.coordinates, zoom: map.getZoom() + 4 });
      });

      // Set the initial count.
      visibleCount.text('Total Instruments: ' + geoJson.length);

      fit();

      setTimeout(function(){ $('.loader').hide(); }, 1000);


      map.on('click', 'instruments', function (e) {
        var instrument = JSON.parse(e.features[0].properties.instrument);
        var html = '<div id="popUpBox"><h1>' + instrument.address.organization + '</h1><b>Instrument:</b> ' + instrument.equipment.name + '<br><b>Where:</b> ' + instrument.address.city + ', ' + instrument.address.state + '<br><b>id:</b> ' + e.features[0].properties.instrumentId + '</div>';
        // html = html + `<br><a href="https://app.meenta.io/machine/${e.features[0].properties.instrumentId}" target="_blank">More</a>`
        new mapboxgl.Popup().setLngLat(e.lngLat).setHTML(html).addTo(map);
      });

    });
  });

});
