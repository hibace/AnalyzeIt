$(document).ready(function () {
    AOS.init();
    $('#fullpage').fullpage({
        anchors: ['AnalyzeIt', 'Chooser', 'FaceDetect', 'EmotionExplorer', 'ImageAnalyzer', 'Contacts'],
        menu: '#myMenu',
        normalScrollElements: '#myScrollDivFD',
        scrollOverflow: true
    });
    
});
