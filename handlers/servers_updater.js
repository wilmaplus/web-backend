let needle = require('needle');
const urlConfig = require('../config/urls')
let cacheFileName = __dirname+'/.wilmaservers_cache';
const fs = require('fs');

function updateServerList() {
    needle.get(urlConfig.wilmaServersJSON, function (err, resp) {
        try {
            if (err) {
                console.error(err);
                return;
            }
            fs.writeFile(cacheFileName, JSON.stringify(resp.body.wilmat), function (err) {
                if (err) {
                    console.error(err);
                    return;
                }
                console.log("Cache written successfully");
            });
        } catch (e) {
            console.error(e);
        }
    });
}

module.exports = {
    updateServerList
}