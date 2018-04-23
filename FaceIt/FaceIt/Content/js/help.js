//(function () {
//    var video = document.getElementById('video'),
//        canvas = document.getElementById('canvas');
//        context = canvas.getContext('2d');
//        photo = document.getElementById('photo');
//        vendorUrl = window.URL || window.webkitURL;
//        navigator.getMedia = navigator.getUserMedia ||
//                            navigator.webkitGetUserMedia ||
//                            navigator.mozGetUserMedia ||
//                            navigator.msGetUserMedia;

//    navigator.getMedia({
//        video: true,
//        audio: false
//    }, function (stream) {
//        video.src = vendorUrl.createObjectURL(stream);
//        video.play();
//        }, function (error) {
//        // error
//    });
//    document.getElementById('capture').addEventListener('click', function () {
//        context.drawImage(video, 0, 0, 400, 300);
//        photo.setAttribute('src', canvas.toDataURL('image/png'));
//    });
//})();


//window.onload = function () {
//    var video = document.getElementById('video');
//    var canvas = document.getElementById('canvas');
//    var context = canvas.getContext('2d');
//    var photo = document.getElementById('photo');
//    var tracker = new tracking.ObjectTracker('face');


//    navigator.getUserMedia({ video: true }, function (stream) {
//        localMediaStream = stream;
//    }, function (error) { console.error(error) });

//    tracker.setInitialScale(1);
//    tracker.setStepSize(1);
//    tracker.setEdgesDensity(0.1);
//    tracking.track('#video', tracker, { camera: true });


//    tracker.on('track', function (event) {
//        context.clearRect(0, 0, canvas.width, canvas.height);
//        event.data.forEach(function (rect) {
//            context.strokeStyle = 'blue';
//            context.strokeRect(rect.x, rect.y, rect.width, rect.height);
//            context.font = '11px Helvetica';
//            context.fillStyle = "#fff";
//            context.fillText('x: ' + rect.x + 'px', rect.x + rect.width + 5, rect.y + 11);
//            context.fillText('y: ' + rect.y + 'px', rect.x + rect.width + 5, rect.y + 22);
//        });
//    });
//    document.getElementById('capture').addEventListener('click', function () {
//        context.drawImage(video, 0, 0, video.width, video.height);
//        var dataURL = canvas.toDataURL();
//        photo.src = dataURL;
//    });


//};

var convertUrlToFile = function (url) {
    return new File(url);
}

$(document).ready(function () {
    AOS.init();
    $('#fullpage').fullpage({
        anchors: ['AnalyzeIt', 'Chooser', 'FaceDetect', 'EmotionExplorer', 'ImageAnalyzer', 'Contacts'],
        menu: '#myMenu'
    });
    
});



$(document).on('click', '#buttonScroll', function () {
    $.fn.fullpage.moveSectionDown();
});

