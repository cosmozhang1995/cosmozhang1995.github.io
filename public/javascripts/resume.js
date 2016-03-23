var mySkills = {};
var personalSkills = function(skills) {
    var skills = skills;

    function addSkill(skill) {
        var bgColor = (skill.css && skill.css.backgroundColor) || "#000000";
        bgColor = bgColor.substr(1,6);
        var byteLen = 2;
        var colorR = parseInt(bgColor.substr(0 * byteLen, byteLen), 16);
        var colorG = parseInt(bgColor.substr(1 * byteLen, byteLen), 16);
        var colorB = parseInt(bgColor.substr(2 * byteLen, byteLen), 16);
        var alpha1 = 0.5;
        var alpha2 = 1;
        var el = $('<span class="skill-item">' + skill.shortName + '</span>').appendTo('#resume-row-skills');
        el.css('background-color', 'rgba(' + colorR + ',' + colorG + ',' + colorB + ',' + alpha1 + ')');
        el
        .on('mouseenter', function(event) {
            event.preventDefault();
            $(this).css('background-color', 'rgba(' + colorR + ',' + colorG + ',' + colorB + ',' + alpha2 + ')');
        })
        .on('mouseleave', function(event) {
            event.preventDefault();
            $(this).css('background-color', 'rgba(' + colorR + ',' + colorG + ',' + colorB + ',' + alpha1 + ')');
        });
    }

    function initialSkills() {
        $('#resume-row-skills').children().remove();
        for (var i = 0; i < skills.length; i++) {
            addSkill(skills[i]);
        }
    }
    initialSkills();
}
$(document).ready(function() {
    $.getJSON(site_url + "/public/data/resume/skills.json", function(data) {
        mySkills = data;
        personalSkills(mySkills);
    });
});

var myCourse = {
    configs: {
        'education': {
            'color': 'rgb(153,204,51)',
            'tagColor': 'rgb(255,102,102)',
            'icon': 'education',
            'title': '教育经历&nbsp;EDUCATION',
            'foot': 'TODAY'
        },
        'career': {
            'color': 'rgb(0,153,204)',
            'tagColor': 'rgb(153,204,51)',
            'icon': 'knight',
            'title': '工作经历&nbsp;CAREER',
            'foot': 'TODAY'
        },
        'project': {
            'color': 'rgb(255,102,102)',
            'tagColor': 'rgb(0,153,204)',
            'icon': 'blackboard',
            'title': '项目经历&nbsp;PROJECTS',
            'foot': 'TODAY'
        }
    },
    education: [],
    career: [],
    project: []
}
function personalCourse(course) {

    function checkDescHover(e, ele, checkIn) {
        var title = $(ele).find('.title');
        var descInner = $(ele).find('.desc-inner')[0];
        var desc = $(ele).find('.desc')[0];
        var appendHeight = 20 + descInner.clientHeight;
        // if (!checkIn) appendHeight -= 100;       // Always has a error 100, I don't know why, waiting to solve
        var pos = title.getPosition();
        pos.bottom += appendHeight;
        var clientX = e.clientX + (document.body.scrollLeft||document.documentElement.scrollLeft);
        var clientY = e.clientY + (document.body.scrollTop||document.documentElement.scrollTop);
        // console.log(e.clientX, e.clientY);
        // console.log({x:clientX,y:clientY}, pos);
        if (clientX <= pos.right && clientX >= pos.left && clientY <= pos.bottom && clientY >= pos.top) 
            return true;
        return false;
    }

    function mouseOver(e) {
        // console.log('in');
        if (checkDescHover(e,this, true)) {
            // console.log('checkover');
            var theItem = $(this).parents('.item')[0];
            var theBackColor = $('.main-container').css('background-color');
            $(theItem).find('.column-middle .circle').css('background-color', this.style.backgroundColor);
            $(theItem).find('.column-middle .circle').css('border-color', theBackColor);
            $(this).find('.desc').show(200, function() {
                var windowBottom = document.documentElement.clientHeight + (document.body.scrollTop||document.documentElement.scrollTop);
                var bottomMargin = windowBottom - ($(this).parents('.item').getPosition().bottom) ;
                if (bottomMargin < 0) {
                    var offset = -bottomMargin;
                    var currScrollTop = (document.body.scrollTop||document.documentElement.scrollTop);
                    var toScrollTop = currScrollTop + offset + 'px';
                    $(document.body).animate({'scrollTop': toScrollTop}, 200);
                }
            });
        }
    }

    function mouseOut(e) {
        // console.log('out');
        if (!checkDescHover(e,this,false)) {
            // console.log('checkout');
            mye = $(this).find('.desc');
            var theItem = $(this).parents('.item')[0];
            var theBackColor = $('body').css('background-color');
            // $(theItem).find('.column-middle .circle').css('border-color', this.style.backgroundColor);
            $(theItem).find('.column-middle .circle').css('border-color', 'rgb(225,225,225)');
            $(theItem).find('.column-middle .circle').css('background-color', theBackColor);
            $(this).find('.desc').hide(200, function() {});
        }
    }

    function addItem(courseType, courseItem, contentInLeft) {
        var row = document.createElement('div');
        row.className = "item";
        var columnLeft = document.createElement('div');
        columnLeft.className = "column column-left";
        var columnMiddle = document.createElement('div');
        columnMiddle.className = "column column-middle";
        var columnRight = document.createElement('div');
        columnRight.className = "column column-right";
        var middleCircle = document.createElement('div');
        middleCircle.className = "circle";
        var infoBlock = document.createElement('div');
        infoBlock.className = "info-container";
        var quotBlock = document.createElement('div');
        quotBlock.className = "quot-container";
        var infoTag = document.createElement('div');
        infoTag.className = "info-tag";
        var infoTime = document.createElement('div');
        infoTime.className = "info-time";
        var quotBody = document.createElement('div');
        quotBody.className = "quot-block";
        var quotTitle = document.createElement('div');
        quotTitle.className = "title";
        var quotDesc = document.createElement('div');
        quotDesc.className = "desc";
        var quotDescInner = document.createElement('div');
        quotDescInner.className = "desc-inner";
        var quotArrow = document.createElement('div');
        quotArrow.className = "quot-arrow";

        quotTitle.innerHTML = courseItem.title;
        quotDescInner.innerHTML = courseItem.desc;
        infoTag.innerHTML = courseItem.tag;
        infoTime.innerHTML = courseItem.startYear;

        var isOpera = navigator.userAgent.indexOf("Opera") > -1;
        if (!isOpera) {
            // Opera performs badly in hover animation
            quotDesc.style.display = 'none';
            quotBody.onmouseover = mouseOver;
            quotBody.onmouseout = mouseOut;
        }

        var config = course.configs[courseType];
        infoTag.style.color = config.tagColor;
        quotBody.style.backgroundColor = config.color;
        if (contentInLeft) {
            quotArrow.style.borderColor = 'transparent transparent transparent ' + config.color;
        } else {
            quotArrow.style.borderColor = 'transparent ' + config.color + ' transparent transparent';
        }

        $('#resume-row-time-line-' + courseType + ' .item-content')[0].appendChild(row);
        row.appendChild(columnLeft);
        row.appendChild(columnMiddle);
        row.appendChild(columnRight);
        columnMiddle.appendChild(middleCircle);
        if (contentInLeft) {
            columnLeft.appendChild(quotBlock);
            columnRight.appendChild(infoBlock);
        } else {
            columnRight.appendChild(quotBlock);
            columnLeft.appendChild(infoBlock);
        }
        quotBlock.appendChild(quotArrow);
        quotBlock.appendChild(quotBody);
        quotBody.appendChild(quotTitle);
        quotBody.appendChild(quotDesc);
        quotDesc.appendChild(quotDescInner);
        infoBlock.appendChild(infoTag);
        infoBlock.appendChild(infoTime);
    }

    function addItems(courseType) {
        addFrame(courseType);
        var config = course.configs[courseType];
        $('#resume-row-time-line-' + courseType + ' .time-line').css('background-color', config.color);
        $('#resume-row-time-line-' + courseType + ' .item-content *').remove();
        var theCourseItems = course[courseType];
        var contentInLeft = Math.random() >= 0.5 ? false : true;
        for (var i = 0; i < theCourseItems.length; i++) {
            contentInLeft = !contentInLeft;
            addItem(courseType, theCourseItems[i], contentInLeft);
        }
    }

    function addFrame(courseType) {
        if (document.getElementById('resume-row-time-line-' + courseType) == undefined) {
            var config = course.configs[courseType];
            var row = document.createElement('div');
            row.className = 'resume-row resume-row-time-line';
            row.id = 'resume-row-time-line-' + courseType;
            var timeLine = document.createElement('div');
            timeLine.className = 'time-line';
            var itemTitle = document.createElement('div');
            itemTitle.className = 'item-title';
            var itemTitleTitle = document.createElement('div');
            itemTitleTitle.className = 'title';
            var itemIconSpan = document.createElement('span');
            var itemTitleSpan = document.createElement('span');
            var itemIconIcon = document.createElement('i');
            itemIconIcon.className = 'glyphicon glyphicon-' + config.icon;
            var itemContent = document.createElement('div');
            itemContent.className = 'item-content';
            var itemFoot = document.createElement('div');
            itemFoot.className = 'item-foot';
            var itemFootFoot = document.createElement('div');
            itemFootFoot.className = 'foot';
            var itemFootSpan = document.createElement('span');
            itemTitleSpan.innerHTML = '&nbsp;' + config.title;
            itemFootSpan.innerHTML = config.foot;
            document.getElementById('resume-row-time-line-container').appendChild(row);
            row.appendChild(timeLine);
            timeLine.appendChild(document.createElement('div'));
            row.appendChild(itemTitle);
            itemTitle.appendChild(itemTitleTitle);
            itemTitleTitle.appendChild(itemIconSpan);
            itemIconSpan.appendChild(itemIconIcon);
            itemTitleTitle.appendChild(itemTitleSpan);
            row.appendChild(itemContent);
            row.appendChild(itemFoot);
            itemFoot.appendChild(itemFootFoot);
            itemFootFoot.appendChild(itemFootSpan);
        }
    }

    function addAllItems() {
        // addItems('education');
        for (var type in myCourse) {
            if (type != 'configs') {
                addItems(type);
            }
        }
    }

    addAllItems();
}
$(document).ready(function() {
    personalCourse(myCourse);
});


// ====================== MOBILE ========================
var experiences = {
    "education": [],
    "career": [],
    "projects": []
};
function handleDesc(desc) {
    var returnString = desc;
    returnString = returnString.replace(/<br\/{0,1}><br\/{0,1}>/g, '<br/><span class="rest"></span>');
    return returnString;
}
function addMobileItem(type, item) {
    var theContainer = document.getElementById("experience-" + type);
    if (theContainer) {
        var theList = $(theContainer).find('.experience-list')[0];
        if (theList) {
            var itemDiv = document.createElement('div');
            itemDiv.className = "experience-item";
            var timeDiv = document.createElement('div');
            timeDiv.className = "time";
            var pointerContainer = document.createElement('div');
            pointerContainer.className = "pointer-container";
            var pointerDiv = document.createElement('div');
            pointerDiv.className = "pointer";
            var textDiv = document.createElement('div');
            textDiv.className = "text";
            var titleDiv = document.createElement('div');
            titleDiv.className = "title";
            var descDiv = document.createElement('div');
            descDiv.className = "desc";

            timeDiv.innerHTML = item.startYear + "." + item.startMonth;
            titleDiv.innerHTML = item.title;
            descDiv.innerHTML = handleDesc(item.desc);

            textDiv.appendChild(titleDiv);
            textDiv.appendChild(descDiv);
            pointerContainer.appendChild(pointerDiv);
            itemDiv.appendChild(timeDiv);
            itemDiv.appendChild(pointerContainer);
            itemDiv.appendChild(textDiv);
            theList.appendChild(itemDiv);
        }
    }
}
function addMobileType(type, list) {
    var theContainer = document.getElementById("experience-" + type);
    if (theContainer) {
        var theList = $(theContainer).find('.experience-list');
        if (theList.length > 0) {
            theList.children().remove();
            for (var i = 0; i < list.length; i++) {
                addMobileItem(type, list[i]);
            }
        }
    }
}
function addAllMobileItems(experienceList) {
    for (var type in experienceList) {
        addMobileType(type, experienceList[type]);
    }
}
// ====================== MOBILE ========================


$(document).ready(function() {
    var eduLoaded = false;
    var careerLoaded = false;
    var projectsLoaded = false;
    $.getJSON(site_url + "/public/data/resume/education.json", function(data) {
        // for PC
        myCourse['education'] = data;
        eduLoaded = true;
        if (eduLoaded && careerLoaded && projectsLoaded) {
            personalCourse(myCourse);
        }

        // for mobile
        experiences['education'] = data;
        addMobileType('education', data);
    });
    $.getJSON(site_url + "/public/data/resume/career.json", function(data) {
        // for PC
        myCourse['career'] = data;
        careerLoaded = true;
        if (eduLoaded && careerLoaded && projectsLoaded) {
            personalCourse(myCourse);
        }

        // for mobile
        experiences['career'] = data;
        addMobileType('career', data);
    });
    $.getJSON(site_url + "/public/data/resume/projects.json", function(data) {
        // for PC
        myCourse['project'] = data;
        projectsLoaded = true;
        if (eduLoaded && careerLoaded && projectsLoaded) {
            personalCourse(myCourse);
        }

        // for mobile
        experiences['projects'] = data;
        addMobileType('projects', data);
    });
});
