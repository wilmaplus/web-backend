let needle = require('needle');
let dateFormat = require('dateformat');

function login(serverUrl, username, password, loginId, apiKey, error, response) {
    serverUrl = correctAddress(serverUrl);
    needle.post(serverUrl+'index_json', {'Login': username, 'Password': password, 'SESSIONID': loginId,
        'ApiKey': apiKey, 'CompleteJson': '', 'format': 'json'}, {multipart: true, follow: 5}, function (err, resp) {
        try {
            if (err) {
                console.error(err);
                error(err);
                return;
            }
            if (resp.body.error) {
                response(resp.body);
                return;
            }
            let cookie = '';
            if (resp.headers['set-cookie']) {
                if (Array.isArray(resp.headers['set-cookie'])) {
                    resp.headers['set-cookie'].forEach(function (item) {
                        if (item.includes("Wilma2SID=") && cookie.length < 1)
                            cookie = item;
                    });
                } else if (resp.headers['set-cookie'].includes('Wilma2SID='))
                    cookie = resp.headers['set-cookie'];
            }
            if (cookie.length < 1) {
                error('invalid_auth', 'Unable to sign in, please check your password');
                return;
            }
            response(resp.body, cookie);
        } catch (e) {
            console.error(e);
            error(e.toString());
        }
    })
}

function homepage(session, serverUrl, error, response) {
    serverUrl = correctAddress(serverUrl);
    needle.get(serverUrl+'index_json', {cookies: {'Wilma2SID': session}}, function (err, resp) {
        if (err) {
            console.error(err);
            error(err);
            return;
        }
        response(resp.body);
    });
}

function messages(session, serverUrl, error, response) {
    serverUrl = correctAddress(serverUrl);
    needle.get(serverUrl+'messages/index_json', {cookies: {'Wilma2SID': session}}, function (err, resp) {
        if (err) {
            console.error(err);
            error(err);
            return;
        }
        response(resp.body);
    });
}

function message(session, serverUrl, param, error, response) {
    serverUrl = correctAddress(serverUrl);
    needle.get(serverUrl+'messages/index_json/'+param, {cookies: {'Wilma2SID': session}}, function (err, resp) {
        if (err) {
            console.error(err);
            error(err);
            return;
        }
        response(resp.body);
    });
}

function schedule(session, serverUrl, error, response) {
    serverUrl = correctAddress(serverUrl);
    let date = dateFormat(new Date(), 'dd.mm.yyyy');
    needle.get(serverUrl+'schedule/index_json?date='+date, {cookies: {'Wilma2SID': session}}, function (err, resp) {
        if (err) {
            console.error(err);
            error(err);
            return;
        }
        response(resp.body, date);
    });
}


function scheduleWithDate(jsDate, session, serverUrl, error, response) {
    serverUrl = correctAddress(serverUrl);
    let date = dateFormat(jsDate, 'dd.mm.yyyy');
    needle.get(serverUrl+'schedule/index_json?date='+date, {cookies: {'Wilma2SID': session}}, function (err, resp) {
        if (err) {
            console.error(err);
            error(err);
            return;
        }
        response(resp.body, date);
    });
}

function correctAddress(url) {
    if (!url.endsWith("/"))
        return url+"/"
    return url;
}

module.exports = {
    login,
    homepage,
    schedule,
    scheduleWithDate,
    messages,
    message
}