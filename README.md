# Bike Map

Trip planning using OpenRouteService routing, OpenStreetMap places, and CyclOSM cycle tiles.

To run:

```
$ pip install
$ export FLASK_APP=app.py
$ export OPENROUTESERVICE_API_KEY="abc123"
$flask run
```

To format:

```
$ black . --exclude venv
```

## Next

* ability to add new days / routes via coordinates
* ability to search for places by name to add to route-making list
* ability to add waypoints to routes to influence routefinding
* try using Leaflet.GridLayer.GoogleMutant
