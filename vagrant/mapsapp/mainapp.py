from flask import Flask, jsonify, request, url_for, abort
from flask import g, render_template, redirect, url_for

from flask.ext.httpauth import HTTPBasicAuth
import json

import httplib2
from flask import make_response
import requests

from tasks import list_data, business_data, ares
import celery.result

app = Flask(__name__)

#redirect to the web page
@app.route('/', methods=['GET'])
def index():
    return redirect("static/index.html")

@app.route('/test', methods=['GET'])
def gettest():
    return "good test"

#get the list of places using the term and lat, lng
@app.route('/getlist', methods=['POST'])
def getlist():
    d = request.get_json()
    print(d)
    term = d['term']
    lat = d['lat']
    lng = d['lng']
    #place the request on the task query
    r = list_data.delay(term,lat,lng)
    #return the task id
    return jsonify({"id": r.task_id})

@app.route('/getbusiness', methods=['POST'])
def getbusiness():
    d = request.get_json()
    print(d)
    bid = d['id']
    r = business_data.delay(bid)
    return jsonify({"id": r.task_id})

#get the result of a task id
@app.route('/getres', methods=['POST'])
def getres():
    d = request.get_json()
    i = d['id']
    #get the task using the correct config
    ar = ares(i)
    #check if it is ready to read
    if (ar.ready() == True):
        #read it and sent it back as json
        return jsonify(ar.get())
    else:
        #still waiting let the client know
        return jsonify({"state":"waiting"})

if __name__ == '__main__':
    app.debug = True
    app.run(host='0.0.0.0', port=5000)
