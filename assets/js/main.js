(function () {
  'use strict';

  var BASE_W = 1366, BASE_H = 768;
  var appEl  = document.getElementById('app');

  function updateScale() {
    var s = Math.min(window.innerWidth / BASE_W, window.innerHeight / BASE_H);
    document.documentElement.style.setProperty('--scale', s);
    appEl.style.transform = 'translate(-50%,-50%) scale(' + s + ')';
  }

  updateScale();
  window.addEventListener('resize', updateScale);

}());
