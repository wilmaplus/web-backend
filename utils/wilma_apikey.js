const crypto = require('crypto')

function calculateKey(username, loginId, apikey) {
    return "sha1:"+crypto.createHash('sha1').update(username+'|'+loginId+'|'+apikey).digest('hex');
}

module.exports = {
    calculateKey
}