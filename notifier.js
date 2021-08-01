const request = require('request');

class Notifier {
    constructor(appToken, subscriberUids) {
        this.appToken = appToken;
        this.subscriberUids = subscriberUids;
    }

    getSubscriberIds() {
        return this.subscriberUids;
    }

    push2Wechat(s) {
        let options = {
            url: wechatPusherUrl,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                'appToken': this.appToken,
                'content': s,
                'summary': '英飒英飒预约信息推送',
                'contentType': 3,
                'uids': this.getSubscriberIds()
            })
        };

        return new Promise((resolve, reject) => {
            request(options, (err, response) => {
                if (err || response.statusCode != 200) {
                    reject(err || response);
                    return;
                }

                let body = JSON.parse(response.body);
                if (!body.success) {
                    reject(response);
                    console.error(body.data);
                    return;
                }

                resolve(body);
            })
        })
    }
}

const wechatPusherUrl = 'http://wxpusher.zjiecode.com/api/send/message';

module.exports = Notifier;