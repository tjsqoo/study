var arrayScript = [
    "//dapi.kakao.com/v2/maps/sdk.js?appkey=6e9b4d15f4052c0801de6c681bbc68f9&libraries=services&autoload=false"
];
var loadCount = 0;

arrayScript.forEach(item => {
    loadScript(item, init);
});

function loadScript(url, callback){
    var script = document.createElement('script');
    script.onload = function () {
        loadCount++;
        callback();
    };
    script.src = url;
    document.head.appendChild(script);
}

function init() {
    if (loadCount < arrayScript.length) return;

    daum.maps.load(function() {
        var container = document.getElementById('kakao-map');
        var options = {
            center: new daum.maps.LatLng(33.450701, 126.570667),
            level: 3
        };
        
        var map = new daum.maps.Map(container, options);

        var geocoder = new daum.maps.services.Geocoder();
        geocoder.addressSearch('서울특별시 송파구 백제고분로41길 20', function(result, status) {
            if (status != daum.maps.services.Status.OK) return;

            var coords = new daum.maps.LatLng(result[0].y, result[0].x);
            var marker = new daum.maps.Marker({
                map: map,
                position: coords
            });
            var infowindow = new daum.maps.InfoWindow({
                content: '<div style="width:150px;text-align:center;padding:6px 0;">우리 집</div>'
            });

            infowindow.open(map, marker);
            map.setCenter(coords);

           
        });

        daum.maps.event.addListener(map, 'click', function(mouseEvent) {        
            var latlng = mouseEvent.latLng; 
            var marker = new daum.maps.Marker({
                map: map,
                position: latlng
            });
            
            // var message = '클릭한 위치의 위도는 ' + latlng.getLat() + ' 이고, ';
            // message += '경도는 ' + latlng.getLng() + ' 입니다';
            
            // var resultDiv = document.getElementById('clickLatlng'); 
            // resultDiv.innerHTML = message;
            
        });
    });
}
