$(function() {
    $('.nav-menu').click(function(event) {
        $(this).closest('.nav').toggleClass('expand');
    });
});

$.fn.getPosition = function() {
    var pos = $(this).offset();
    pos.right = pos.left + $(this).outerWidth();
    pos.bottom = pos.top + $(this).outerHeight();
    return pos;
};

$(function() {
    if (!window.MathJax) return;
    window.MathJax.Hub.Config({
        showProcessingMessage: false,
        jax: ["input/TeX", "output/HTML-CSS"],
        tex2jax: {
            inlineMath: [["$", "$"], ["\\(", "\\)"]],
            displayMath: [["$$", "$$"], ["\\[", "\\]"]],
            skipTags: ["script", "noscript", "style", "textarea", "pre", "code", "a"]
        },
        "HTML-CSS": {
            availableFonts: ["STIX", "TeX"],
            showMathMenu: false
        }
    });
});