$(document).ready(function () {
    $(".button-collapse").sideNav();
    $("#bg1").css({
        "background-image": "url('img/responsive-web-design.png')"
    });
    $("#bg2").css({
        "background-image": "url('img/ada.png')"
    });
    $("#bg3").css({
        "background-image": "url('img/e-filing.png')"
    });
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('./sw.js');
        });
    }
    
});