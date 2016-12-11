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

$(function() {
    $('em').each(function(index, el) {
        var htmlText = $(this).html();

        // Equation
        var isEq = htmlText.substr(0,4) == "\\eq ";
        var isEqc = htmlText.substr(0,5) == "\\eqc ";
        if (isEq || isEqc) {
            var equation;
            if (isEq) equation = htmlText.substr(4);
            else if (isEqc) equation = htmlText.substr(5);
            equation = equation.replace(/\n/g, ' \\\\');
            equation = equation.replace(/\s/g, '%20');
            equation = equation.replace(/[\'\‘\’]/g, '%27');
            var imgEl = $('<img src="http://101.201.68.146/cgi-bin/mathtex.cgi?' + equation + '"/>');
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