$(document).ready(function () {
    initMenu();
});

function initMenu() {

    /*
            <li class="nav-item">
              <a class="nav-link" href="">home</a>
            </li>
            <li class="nav-item dropdown">
              <a class="nav-link dropdown-toggle" href="photos.html?year=2022" id="navbarDropdownabout" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                photos
              </a>
              <div class="dropdown-menu dropdown-menu-right" aria-labelledby="navbarDropdownabout">
                  <a class="dropdown-item" href="photos.html?year=2020">2020</a>
                  <a class="dropdown-item" href="photos.html?year=2021">2021</a>
                  <a class="dropdown-item" href="photos.html?year=2022">2022</a>
              </div>
            </li>
    */

    $.getJSON('/static/json/menu.json', function (mArr) {
        mArr.forEach(m => {
            if (m.items) {
                var mi = '<li class="nav-item dropdown"><a class="nav-link dropdown-toggle" href="' + m.url + '" id="navbarDropdownabout" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">' + m.name + '</a>';
                mi += '<div class="dropdown-menu dropdown-menu-right" aria-labelledby="navbarDropdownabout">';
                m.items.forEach(im => {
                    mi += '<a class="dropdown-item" href="' + im.url + '">' + im.name + '</a>';
                });
                mi += '</div></li>';
                $('#menu').append(mi);
            } else {
                $('#menu').append('<li class="nav-item"><a class="nav-link" href="' + m.url + '">' + m.name + '</a></li>');
            }
        });
    });
}