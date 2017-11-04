
var map;
var allmarkers = [];
//initalize google maps
function initMap() {
    //set my location
    var myloc = {lat: 37.5356, lng: -77.4238};

    map = new google.maps.Map(document.getElementById('map'), {
        center: myloc,
        zoom: 15
    });

    infowindow = new google.maps.InfoWindow();
    //load nearby places using the places service
    var service = new google.maps.places.PlacesService(map);
    place_types = ['museum','cafe','store','restaurant'];
    for (var pt of place_types)
    {
        $.ajax({
            type: "POST",
            url: "http://localhost:5000/getlist",
            data: JSON.stringify({"term":pt,"lat":myloc.lat, "lng": myloc.lng}),
            success: listres,
            error: getlistError,
            contentType: "application/json",
            dataType: 'json'
        });
    }
    /*
    for (var x of place_types)
    {
        service.nearbySearch({
            location: myloc,
            radius: 2000,
            type: [x]
        }, callback);
    }*/
}

function getlistError(){
    alert("Error: the server seems to not be working 1");
}

function listres(data){

    var timer = setInterval(function() {
        //console.log("trying get res for "+data.id)
        $.ajax({
            type: "POST",
            url: "http://localhost:5000/getres",
            data: JSON.stringify({"id":data.id}),
            success: function(d){
                if (('state' in  d) && (d.state == "waiting")){
                    console.log("waiting");
                }
                else {
                    //console.log(d);
                    for (var x of d)
                    {
                        //console.log(x.coordinates);
                        //console.log(x.id);
                        //console.log(x.name);
                        createMarker(x);
                        vm.mymarkers.push({ name: x.name});
                    }
                    clearInterval(timer);
                }
            },
            error: function(){alert("Error: the server seems to not be working 2");},
            contentType: "application/json",
            dataType: 'json'
        });
    },800);
}

//create a marker fro all the places returned
function callback(results, status) {
    if (status === google.maps.places.PlacesServiceStatus.OK) {
        for (var i = 0; i < results.length; i++) {
            vm.mymarkers.push({ name: results[i].name});
            createMarker(results[i]);
        }
    }
}

//display markesr filtered by a word
function displayMarkers(fword){
    //clear all the markers
    allmarkers.map(function(x){
        x[1].setMap(null);
    });
    //filter for the word
    var fmarkers = allmarkers.filter(function(mk){
        return mk[0].toLowerCase().indexOf(fword.toLowerCase()) !== -1;
    });
    //set the returned markers
    fmarkers.map(function(x){
        x[1].setMap(map);
    });
}
//display all the markers
function displayAllMarkers(){
    allmarkers.map(function(x){
        x[1].setMap(map);
    });
}

//create a marker at a place
function createMarker(place) {
    //var placeLoc = place.geometry.location;
    var placeLoc = {"lat":place.coordinates.latitude,"lng":place.coordinates.longitude};
    var marker = new google.maps.Marker({
        map: map,
        position: placeLoc
    });
    marker.placedata = place;
    allmarkers.push([place.name,marker]);

    //add a click event
    google.maps.event.addListener(marker, 'click', function() {

        allmarkers.map(function(x){
            x[1].setAnimation(null);
        });

        this.setAnimation(google.maps.Animation.BOUNCE);
        vm.infotitle(this.placedata.name);
        vm.infophone(this.placedata.display_phone);
        vm.infoaddress(this.placedata.location.display_address);
        vm.infourl(this.placedata.url);
        vm.infoimg(this.placedata.image_url);
        console.log(this.placedata.image_url);
        vm.flipinfo();

        //this.placedata.name
        //infowindow.setContent(place.name);
        //infowindow.open(map, this);
    });
}

function OpenInfoWindow(mrk)
{
    var n = allmarkers.filter(function(mk){
        return mk[0] == mrk;
    });
    mrk1 = n[0][1];
    vm.infotitle(mrk1.placedata.name);
    vm.infophone(mrk1.placedata.display_phone);
    vm.infoaddress(mrk1.placedata.location.display_address);
    vm.infourl(mrk1.placedata.url);
    vm.infoimg(mrk1.placedata.image_url);
    console.log(mrk1.placedata.image_url);
    vm.flipinfo();


    allmarkers.map(function(x){
        x[1].setAnimation(null);
    });

    n[0][1].setAnimation(google.maps.Animation.BOUNCE);

    setTimeout( function(){
        allmarkers.map(function(x){
            x[1].setAnimation(null);
        });
    },2000);

}

//open a info window using a marker name
/*function OpenInfoWindow(mrk)
{
    var n = allmarkers.filter(function(mk){
        return mk[0] == mrk;
    });
    var iw = new google.maps.InfoWindow({content: mrk});
    iw.open(map, n[0][1]);

    allmarkers.map(function(x){
        x[1].setAnimation(null);
    });

    n[0][1].setAnimation(google.maps.Animation.BOUNCE);

    setTimeout( function(){
        allmarkers.map(function(x){
            x[1].setAnimation(null);
        });
    },2000)

}*/


// View model
var ViewModel = function() {
    var self = this;
    self.infotitle = ko.observable("info title");
    self.infophone = ko.observable("123456789");
    self.infoaddress = ko.observable("123 address way");
    self.infourl = ko.observable("http://yelp.com");
    self.infoimg = ko.observable("https://s3-media4.fl.yelpcdn.com/bphoto/deMVykagZJkIyJkP_4BdGQ/o.jpg");
    self.showinfo = ko.observable(false);

    self.location = ko.observable("Richmond, Virginia");

    self.sidebar = ko.observable("sidebar_hide");
    self.mainarea = ko.observable("col-xs-12");

    self.currentFilter = ko.observable();


    self.mymarkers = ko.observableArray([]);

    self.FilteredMarkers = ko.computed(function () {

        if (!self.currentFilter()) {
            //nothing in filter so display all the markers and return a unfiltered list
            displayAllMarkers();
            return self.mymarkers();
        } else {
            //filter for the word and display only those markers
            displayMarkers(self.currentFilter());
            return ko.utils.arrayFilter(self.mymarkers(), function (mrk) {
                return mrk.name.toLowerCase().indexOf(self.currentFilter().toLowerCase()) !== -1;
            });
        }
    });

    self.showimage = ko.computed(function(){
        if (self.infoimg() === "")
        {
            return false;
        }
        else {
            return true;
        }
    });

    //oepn a info window for the clicked item
    self.itemclick = function(mrk)
    {
        OpenInfoWindow(mrk);
    };
    self.flipinfo = function(){
        if (self.showinfo())
        {
            self.showinfo(false);
        }
        else {
            self.showinfo(true);
        }
    };

    //oepn or close the menu
    self.openmenu = function() {
         if (self.sidebar() == "sidebar_hide")
         {
             self.sidebar("col-sm-3");
             self.mainarea("col-sm-9");
         }
         else {
             self.sidebar("sidebar_hide");
             self.mainarea("col-sm-12");
         }
     };

};

function masperrorHandler(){
    alert("error loading google maps");
}

vm = new ViewModel();
ko.applyBindings(vm);
