/* fakeholder element */

var HOLD_ATTRIBUTES = [
    "class", "target", "style"
];

$(function() {
    $('fakeholder').each(function(index, el) {
        var pel = $(this).parent();
        for (var i = 0; i < HOLD_ATTRIBUTES.length; i++) {
            var attr = HOLD_ATTRIBUTES[i];
            var val = $(this).attr(attr);
            if (val !== undefined && pel.attr(attr) === undefined) {
                pel.attr(attr, val);
            }
        }
    });
});

/* class replacements */

// var CLASS_REPLACE_SELECTORS = "blockquote";
// var CLASS_REPLACE_CLASSES = ["warning", "danger", "primary", "success"];

// $(function() {
//     var classReplaceClassesRegExp = new RegExp("^(" + CLASS_REPLACE_CLASSES.map(classReplaceWrap).join("|") + ")");
//     $('blockquote').each(function(index, el) {
//         var text = $(this).text();
//         text.replace(classReplaceClassesRegExp, classReplaceUnwrap("$1"));
//     });

//     function classReplaceWrap(classname) {
//         return "_" + classname;
//     }
//     function classReplaceUnwrap(classnameWrapped) {
//         return classnameWrapped.substr(1);
//     }
// });