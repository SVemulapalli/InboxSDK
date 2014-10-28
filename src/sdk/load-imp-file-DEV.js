var RSVP = require('rsvp');

function loadImpFile() {
  return new RSVP.Promise(function(resolve, reject) {
    setTimeout(function() {
      require('../imp/main.js');
      resolve();
    }, 500);
  });
}

module.exports = loadImpFile;
