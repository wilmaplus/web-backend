const resUtils = require("../../utils/response_utilities")
const wilmaApi = require('../../wilma_api/api')
const validUrl = require('valid-url');
const {reworkMessageHTML} = require("../../utils/messages");

function list(req, res) {
    try {
        if (req.body.session && req.body.server) {
            const session = req.body.session;
            const server = req.body.server;
            if (server.length > 255) {
                resUtils.responseStatus(res, 400, false, {cause: 'server is too long!'});
                return;
            }
            if (session.length > 4096) {
                resUtils.responseStatus(res, 400, false, {cause: 'session is too long!'});
                return;
            }
            if (!validUrl.isWebUri(server)) {
                resUtils.responseStatus(res, 400, false, {cause: 'server is invalid!'});
                return;
            }
            wilmaApi.messages(session, server, function (error, localization) {
                if (localization)
                    resUtils.responseStatus(res, 500, false, {cause: error.toString(), localization: localization});
                else
                    resUtils.responseStatus(res, 500, false, {cause: error.toString()});
            }, function (response) {
                if (response.error) {
                    resUtils.responseStatus(res, 500, false, {cause: response.error.message, wilma: response.error});
                    return;
                }
                resUtils.responseStatus(res, 200, true, {messages: (response.Messages || [])});
            })
        } else {
            resUtils.responseStatus(res, 400, false, {cause: 'Required parameters are missing'});
        }
    } catch (e) {
        resUtils.responseStatus(res, 500, false, {cause: e.toString()})
    }
}

function folder(req, res) {
    try {
        if (req.body.session && req.body.server) {
            const session = req.body.session;
            const server = req.body.server;
            if (server.length > 255) {
                resUtils.responseStatus(res, 400, false, {cause: 'server is too long!'});
                return;
            }
            if (session.length > 1024) {
                resUtils.responseStatus(res, 400, false, {cause: 'session is too long!'});
                return;
            }
            if (!validUrl.isWebUri(server)) {
                resUtils.responseStatus(res, 400, false, {cause: 'server is invalid!'});
                return;
            }
            wilmaApi.message(session, server, req.params.folder, function (error, localization) {
                if (localization)
                    resUtils.responseStatus(res, 500, false, {cause: error.toString(), localization: localization});
                else
                    resUtils.responseStatus(res, 500, false, {cause: error.toString()});
            }, function (response) {
                if (response.error) {
                    resUtils.responseStatus(res, 500, false, {cause: response.error.message, wilma: response.error});
                    return;
                }
                resUtils.responseStatus(res, 200, true, {messages: (response.Messages || [])});
            })
        } else {
            resUtils.responseStatus(res, 400, false, {cause: 'Required parameters are missing'});
        }
    } catch (e) {
        resUtils.responseStatus(res, 500, false, {cause: e.toString()})
    }
}

function get(req, res) {
    try {
        if (req.body.session && req.body.server) {
            const session = req.body.session;
            const server = req.body.server;
            if (server.length > 255) {
                resUtils.responseStatus(res, 400, false, {cause: 'server is too long!'});
                return;
            }
            if (session.length > 1024) {
                resUtils.responseStatus(res, 400, false, {cause: 'session is too long!'});
                return;
            }
            if (!validUrl.isWebUri(server)) {
                resUtils.responseStatus(res, 400, false, {cause: 'server is invalid!'});
                return;
            }
            wilmaApi.message(session, server, req.params.id, function (error, localization) {
                if (localization)
                    resUtils.responseStatus(res, 500, false, {cause: error.toString(), localization: localization});
                else
                    resUtils.responseStatus(res, 500, false, {cause: error.toString()});
            }, function (response) {
                if (response.error) {
                    resUtils.responseStatus(res, 500, false, {cause: response.error.message, wilma: response.error});
                    return;
                }
                if (response.messages && response.messages.length > 0) {
                    let message = response.messages[0];
                    if (message && message.ContentHtml)
                        message.ContentHtml = reworkMessageHTML(message.ContentHtml);
                    if (message && message.ReplyList)
                        for (const reply of message.ReplyList) {
                            reply.ContentHtml = reworkMessageHTML(reply.ContentHtml);
                        }
                    resUtils.responseStatus(res, 200, true, {message: response.messages[0]});
                } else {
                    resUtils.responseStatus(res, 404, false, {cause: 'Message not found', localization: 'msg_missing'});
                }
            })
        } else {
            resUtils.responseStatus(res, 400, false, {cause: 'Required parameters are missing'});
        }
    } catch (e) {
        resUtils.responseStatus(res, 500, false, {cause: e.toString()})
    }
}

function postReply(req, res) {
    try {
        if (req.body.session && req.body.server && req.body.content) {
            const session = req.body.session;
            const server = req.body.server;
            const content = req.body.content;
            if (server.length > 255) {
                resUtils.responseStatus(res, 400, false, {cause: 'server is too long!'});
                return;
            }
            if (session.length > 1024) {
                resUtils.responseStatus(res, 400, false, {cause: 'session is too long!'});
                return;
            }
            if (content.length > 100000) {
                resUtils.responseStatus(res, 400, false, {cause: 'content is too long!'});
                return;
            }
            if (!validUrl.isWebUri(server)) {
                resUtils.responseStatus(res, 400, false, {cause: 'server is invalid!'});
                return;
            }
            wilmaApi.message(session, server, req.params.id, function (error, localization) {
                if (localization)
                    resUtils.responseStatus(res, 500, false, {cause: error.toString(), localization: localization});
                else
                    resUtils.responseStatus(res, 500, false, {cause: error.toString()});
            }, function (response) {
                if (response.error) {
                    resUtils.responseStatus(res, 500, false, {cause: response.error.message, wilma: response.error});
                    return;
                }
                if (response.messages && response.messages.length > 0) {
                    let message = response.messages[0];
                    if (message && message.AllowCollatedReply) {
                        // proceed to reply
                        wilmaApi.collatedReply(session, server, content, req.params.id, function (error, localization) {
                            if (localization)
                                resUtils.responseStatus(res, 500, false, {cause: error.toString(), localization: localization});
                            else
                                resUtils.responseStatus(res, 500, false, {cause: error.toString()});
                        }, function (response) {
                            if (response.error) {
                                resUtils.responseStatus(res, 500, false, {cause: response.error.message, wilma: response.error});
                                return;
                            }
                            if (response.messages && response.messages.length > 0) {
                                resUtils.responseStatus(res, 200, true, {message: response.messages[0]});
                            } else {
                                resUtils.responseStatus(res, 404, false, {cause: 'Message not found', localization: 'msg_missing'});
                            }
                        })
                    } else {
                        resUtils.responseStatus(res, 404, false, {cause: 'Collated replying is not active for this message', localization: 'no_collated_reply'});
                    }
                } else {
                    resUtils.responseStatus(res, 404, false, {cause: 'Message not found', localization: 'msg_missing'});
                }
            })
        } else {
            resUtils.responseStatus(res, 400, false, {cause: 'Required parameters are missing'});
        }
    } catch (e) {
        resUtils.responseStatus(res, 500, false, {cause: e.toString()})
    }
}

module.exports = {
    list,
    get,
    folder,
    postReply
}