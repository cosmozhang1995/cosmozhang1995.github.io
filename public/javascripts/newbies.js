function newbiesList(list) {
    function addNewbiesItem(item) {
        // var anchor = document.createElement('a');
        // var itemDiv = document.createElement('div');
        itemDiv = document.createElement('a');
        var img = document.createElement('img');

        img.onerror = function() {
            this.src = site_url + "/public/images/default_400_200.png";
        }

        // anchor.href = item.url;
        // anchor.target = '_blank';
        itemDiv.href = item.url;
        itemDiv.target = '_blank';
        itemDiv.className = "newbies-item";
        img.src = item.img;

        // document.getElementById('newbies-list').appendChild(anchor);
        // anchor.appendChild(itemDiv);
        document.getElementById('newbies-list').appendChild(itemDiv);
        itemDiv.appendChild(img);
    }

    function initNewbiesList(itemList) {
        $('#newbies-list').children().remove();
        for (var i = 0; i < itemList.length; i++) {
            addNewbiesItem(itemList[i]);
        }
    }

    initNewbiesList(list);
}
$(document).ready(function() {
    $.getJSON(site_url + "/public/data/newbies/newbies.json", function(data) {
        for (var i = 0; i < data.length; i++) {
            if (data[i].img) {
                data[i].img = data[i].img.replace(/\{\{site_url\}\}/g, site_url);
            }
        }
        newbiesList(data);
    });
});