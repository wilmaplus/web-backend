let needle = require('needle');
let dateFormat = require('dateformat');

function login(serverUrl, username, password, loginId, apiKey, error, response) {
    serverUrl = correctAddress(serverUrl);
    needle.post(serverUrl+'login', {'Login': username, 'Password': password, 'SESSIONID': loginId,
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

function parseSession(session) {
    if (session === undefined || session == null)
        return null;
    let sessionSplit = session.split("&MFA=");
    return (sessionSplit.length > 1) ? sessionSplit : [session];
}

function constructCorrectCookies(session) {
    let cookieObject = {};
    let parsedSession = parseSession(session);
    if (parsedSession !== null) {
        cookieObject['Wilma2SID'] = parsedSession[0];
        if (parsedSession.length > 1)
            cookieObject['Wilma2MFASID'] = parsedSession[1];
    }
    return cookieObject;
}

function homepage(session, serverUrl, error, response) {
    serverUrl = correctAddress(serverUrl);
    needle.get(serverUrl+'index_json', {cookies: constructCorrectCookies(session)}, function (err, resp) {
        if (err) {
            console.error(err);
            error(err);
            return;
        }
        let mfaCheck = checkForExpiredMFA(resp.body); response(mfaCheck ? mfaCheck : resp.body);
    });
}

function checkForExpiredMFA(body) {
    if (body !== undefined && body.LoginResult === "mfa_required") {
        return {
            error: {
                id: 'wilmaplus-web-mfa',
                message: 'MFA is required for your account.',
                description: 'You haven\'t completed MFA or the token expired. Please complete MFA Procedure.',
                whatnext: '',
                statuscode: 401
            }
        }
    }
    return undefined;
}

function extractMFAToken(cookie) {
    let regex = /^(.*)Wilma2MFASID=([^;]+)(.*)$/;
    let results = regex.exec(cookie);
    if (results != null && results.length > 2) {
        return results[2];
    }
    return cookie;
}

function applyOTP(session, otpCode, formKey, sessionName, serverUrl, error, response) {
    serverUrl = correctAddress(serverUrl);
    needle.post(serverUrl+'api/v1/accounts/me/mfa/otp/check', {formkey: formKey, payload: JSON.stringify({otp: otpCode, sessionName})}, {cookies: constructCorrectCookies(session)}, function (err, resp) {
        if (err) {
            console.error(err);
            error(err);
            return;
        }
        let cookie = undefined;
        if (resp.headers['set-cookie']) {
            if (Array.isArray(resp.headers['set-cookie'])) {
                resp.headers['set-cookie'].forEach(function (item) {
                    if (item.includes("Wilma2MFASID=") && cookie === undefined)
                        cookie = extractMFAToken(item);
                });
            } else if (resp.headers['set-cookie'].includes('Wilma2MFASID='))
                cookie = extractMFAToken(resp.headers['set-cookie']);
        }
        response(resp.body, cookie);
    });
}

function messages(session, serverUrl, error, response) {
    serverUrl = correctAddress(serverUrl);
    needle.get(serverUrl+'messages/index_json', {cookies: constructCorrectCookies(session)}, function (err, resp) {
        if (err) {
            console.error(err);
            error(err);
            return;
        }
        let mfaCheck = checkForExpiredMFA(resp.body); response(mfaCheck ? mfaCheck : resp.body);
    });
}

function message(session, serverUrl, param, error, response) {
    serverUrl = correctAddress(serverUrl);
    needle.get(serverUrl+'messages/index_json/'+param, {cookies: constructCorrectCookies(session)}, function (err, resp) {
        if (err) {
            console.error(err);
            error(err);
            return;
        }
        let mfaCheck = checkForExpiredMFA(resp.body); response(mfaCheck ? mfaCheck : resp.body);
    });
}

function collatedReply(session, serverUrl, content, messageId, error, response) {
    serverUrl = correctAddress(serverUrl);
    homepage(session, serverUrl, hErr => {error(hErr)}, homepage => {
        let msg = {bodytext: content, formkey: homepage.FormKey, wysiwyg: 'ckeditor', format:'json'};
        needle.post(serverUrl+'messages/collatedreply/'+messageId+'?format=json', msg, {follow_max: 1, follow_set_cookies: true, cookies: constructCorrectCookies(session), json: false, content_type: 'application/x-www-form-urlencoded'}, function (err, resp) {
            if (err) {
                console.error(err);
                error(err);
                return;
            }
            let mfaCheck = checkForExpiredMFA(resp.body); response(mfaCheck ? mfaCheck : resp.body);
        });
    })
}

function schedule(session, serverUrl, error, response) {
    serverUrl = correctAddress(serverUrl);
    let date = dateFormat(new Date(), 'dd.mm.yyyy');
    needle.get(serverUrl+'schedule/index_json?date='+date, {cookies: constructCorrectCookies(session)}, function (err, resp) {
        if (err) {
            console.error(err);
            error(err);
            return;
        }
        let mfaCheck = checkForExpiredMFA(resp.body); response(mfaCheck ? mfaCheck : resp.body);
    });
}


function scheduleWithDate(jsDate, session, serverUrl, error, response) {
    serverUrl = correctAddress(serverUrl);
    let date = dateFormat(jsDate, 'dd.mm.yyyy');
    needle.get(serverUrl+'schedule/index_json?date='+date, {cookies: constructCorrectCookies(session)}, function (err, resp) {
        if (err) {
            console.error(err);
            error(err);
            return;
        }
        let mfaCheck = checkForExpiredMFA(resp.body); response(mfaCheck ? mfaCheck : resp.body, date);
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
    message,
    applyOTP,
    collatedReply
}