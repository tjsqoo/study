var map;
function initMap() {

    var geocoder = new google.maps.Geocoder();
    var address = {
    address: "서울특별시 송파구 백제고분로41길 20"
    }
    geocoder.geocode(address, (results, status) => {
    if (status != google.maps.GeocoderStatus.OK) return;

    console.log(results[0]);
    var location = results[0].geometry.location;

    map = new google.maps.Map(document.getElementById('map-google'), { 
        center: location,
        zoom: 15
    });

    var marker = new google.maps.Marker({
        position: location,
        map: map,
        title: 'Click to zoom'
    });

    var infowindow = new google.maps.InfoWindow({
        content: 'hihihi'
    });

    marker.addListener('click', function() {
        map.setZoom(18);
        map.setCenter(marker.getPosition());
        infowindow.open(map, marker);
    });
    });
}