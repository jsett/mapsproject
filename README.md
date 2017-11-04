vm based on the fullstack-nanodegree-vm from udacity.

How to run
----------

cd to the vagrant directory
```
vagrant up
vagrant ssh

redis-server &
cd /vagrant/mapsapp/
```

Now set your yelp api key in tasks.py
```
CLIENT_ID = "your key"
CLIENT_SECRET = "your key"
```

Set your google api key in index.html
```
<script async defer src="https://maps.googleapis.com/maps/api/js?key=YOUR_KEY_HERE&libraries=places&v=3&callback=initMap" onerror="masperrorHandler()"></script>
```

now start the program
```
celery -A tasks worker --loglevel=info &
python mainapp.py
```

now go to http://localhost:5000/ in your web browser