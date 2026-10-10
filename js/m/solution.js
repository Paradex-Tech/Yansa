/* Phone behaviour: solution
   Runs on every width but does nothing unless the phone media query matches
   (see isPhone), and re-checks on resize/rotation. */
(function () {
  'use strict';
  var phone = window.matchMedia('(max-width: 768px)');
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function isPhone() { return phone.matches; }

  // solution goes here

}());
