const fs = require('fs');

module.exports = {
  log: function(data) {
    fs.appendFile('requestLog.txt', `${JSON.stringify(data)}\n`, function (err) {
      if (err) throw err;
    });
  },
  error: function(data) {
    fs.appendFile('errorLog.txt', `${JSON.stringify(data)}\n`, function (err) {
      if (err) throw err;
    });
  }
};