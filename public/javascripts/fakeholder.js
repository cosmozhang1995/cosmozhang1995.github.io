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
    $('bqholder').each(function(index, el) {
        var pel = $(this).closest('blockquote');
        for (var i = 0; i < HOLD_ATTRIBUTES.length; i++) {
            var attr = HOLD_ATTRIBUTES[i];
            var val = $(this).attr(attr);
            if (val !== undefined && pel.attr(attr) === undefined) {
                pel.attr(attr, val);
            }
        }
    });
});

$(function() {
    $('em').each(function(index, el) {
        var htmlText = $(this).text();

        // Equation
        var isEq = htmlText.substr(0,4) == "\\eq ";
        var isEqc = htmlText.substr(0,5) == "\\eqc ";
        if (isEq || isEqc) {
            var equation;
            if (isEq) equation = htmlText.substr(4);
            else if (isEqc) equation = htmlText.substr(5);
            equation = equation.replace(/\n/g, '%20');
            equation = equation.replace(/\<br\>/g, '%20');
            equation = equation.replace(/\<br\/\>/g, '%20');
            equation = equation.replace(/\s/g, '%20');
            equation = equation.replace(/[\'\‘\’]/g, '%27');
            var imgEl = $('<img class="eq" src="http://101.201.68.146/cgi-bin/mathtex.cgi?' + equation + '"/>');
            if (isEqc) imgEl.addClass('eq-center');
            $(this).after(imgEl);
            $(this).remove();
            return;
        }

        // Equation number
        var isEqn = htmlText.substr(0,5) == "\\eqn ";
        if (isEqn) {
            var nStr = htmlText.substr(5);
            var nStrEl = $('<div class="eq-num">' + nStr + '</div>');
            $(this).after(nStrEl);
            $(this).remove();
            return;
        }

        $(this).attr('class', 'showwwww ' + $(this).attr('class'));
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

$(function () {
    $("blockquote,p").each(function(index, el) {
        var htmlText = $(this).text();
        var m = htmlText.match(/^(\.\w+)+/);
        if (m) {
            var matchedTexts = m[0].split('.');
            for (var i = 0; i < matchedTexts.length; i++) {
                var classname = matchedTexts[i];
                if (classname && classname.length > 0) $(this).addClass(classname);
            }
        }
    });
});

$(function () {
    $("blockquote.collapsable").on('click', function () {
        $(this).toggleClass('uncollapsed');
    });
});

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
