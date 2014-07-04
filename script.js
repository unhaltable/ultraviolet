var installButton = document.getElementById('install-button');

// Smooth scrollTo
var scrollTo = function(el, off){
	$('html, body').animate({
	 	scrollTop: $(el).offset().top - off
	}, 650);
}

$("#header-btn-more").click(function(){ scrollTo("section", 0); });

$("#footer-logo").click(function(){ scrollTo("header", 0); });

if (chrome.app.isInstalled) {
	installButton.style.display = 'none';
}

var stickyNavTop, scrollTop;

var fadeHeader = function () {
    headerHeight = $("header").height();
    scrollTop = $(window).scrollTop();

    $("header").css("opacity", 1 - scrollTop / headerHeight);
};

$(window).scroll(function (){ fadeHeader(); });

$('#slideshow').cycle('fade');