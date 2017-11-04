from celery import Celery

import time

import argparse
import json
import pprint
import requests
import sys
import urllib


# This client code can run on Python 2.x or 3.x.  Your imports can be
# simpler if you only need one of those.
try:
    # For Python 3.0 and later
    from urllib.error import HTTPError
    from urllib.parse import quote
    from urllib.parse import urlencode
except ImportError:
    # Fall back to Python 2's urllib2 and urllib
    from urllib2 import HTTPError
    from urllib import quote
    from urllib import urlencode

#keys
CLIENT_ID = "YOUR KEY"
CLIENT_SECRET = "YOUR KEY"


# API constants, you shouldn't have to change these.
API_HOST = 'https://api.yelp.com'
SEARCH_PATH = '/v3/businesses/search'
BUSINESS_PATH = '/v3/businesses/'  # Business ID will come after slash.
TOKEN_PATH = '/oauth2/token'
GRANT_TYPE = 'client_credentials'

DEFAULT_TERM = 'dinner'
SEARCH_LIMIT = 30

#use redis as the broker and backend
app = Celery('tasks', broker='redis://localhost', backend='redis://localhost')

#allow the webserver to get the retults using a task id
def ares(tid):
    ar = app.AsyncResult(tid)
    return ar

#based of the yelp api sample
class yelp:
    #obtain the token
    def obtain_bearer_token(self,host, path):

        url = '{0}{1}'.format(host, quote(path.encode('utf8')))
        assert CLIENT_ID, "Please supply your client_id."
        assert CLIENT_SECRET, "Please supply your client_secret."
        data = urlencode({
            'client_id': CLIENT_ID,
            'client_secret': CLIENT_SECRET,
            'grant_type': GRANT_TYPE,
        })
        headers = {
            'content-type': 'application/x-www-form-urlencoded',
        }
        response = requests.request('POST', url, data=data, headers=headers)
        bearer_token = response.json()['access_token']
        return bearer_token

    #send a request
    def request(self,host, path, bearer_token, url_params=None):

        url_params = url_params or {}
        url = '{0}{1}'.format(host, quote(path.encode('utf8')))
        headers = {
            'Authorization': 'Bearer %s' % bearer_token,
        }

        response = requests.request('GET', url, headers=headers, params=url_params)

        return response.json()

    #search using the term
    def search(self,bearer_token, term, lat, lng):

        url_params = {
            'term': term.replace(' ', '+'),
            'latitude': lat,
            'longitude': lng,
            'limit': SEARCH_LIMIT
        }
        """
            url_params = {
                'term': term.replace(' ', '+'),
                'location': location.replace(' ', '+'),
                'limit': SEARCH_LIMIT
            }
        """
        return self.request(API_HOST, SEARCH_PATH, bearer_token, url_params=url_params)


    def get_business(self,bearer_token, business_id):

        business_path = BUSINESS_PATH + business_id

        return self.request(API_HOST, business_path, bearer_token)

    #get the token then search
    def list_data(self, term, lat,lng):
        bearer_token = self.obtain_bearer_token(API_HOST, TOKEN_PATH)
        response = self.search(bearer_token, term, lat, lng)
        businesses = response.get('businesses')
        return businesses

    def business_data(self, business_id):
        bearer_token = self.obtain_bearer_token(API_HOST, TOKEN_PATH)
        response = self.get_business(bearer_token, business_id)
        return response

    def query_api(self, term, location):

        bearer_token = self.obtain_bearer_token(API_HOST, TOKEN_PATH)
        print(bearer_token)

        response = search(bearer_token, term, location)

        businesses = response.get('businesses')
        print(len(businesses))
        print(businesses[0])

        business_id = businesses[0]['id']

        response = self.get_business(bearer_token, business_id)
        print(response)

#all the request are placed on a distributed task query so that the web server does not lock up.

#start a task to search on yelp
@app.task
def list_data(term,lat,lng):

    y = yelp()
    r = y.list_data(term,lat,lng)
    return r

@app.task
def business_data(business_id):

    y = yelp()
    r = y.business_data(business_id)
    return r
