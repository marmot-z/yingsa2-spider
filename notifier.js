const request = require('request');
const {getCondition} = require('./notify-condition');

const WECHAT_PUSH_URL = 'http://wxpusher.zjiecode.com/api/send/message';

class Notifier {
    constructor(appToken, subscriberUids, condition) {
        this.appToken = appToken;
        this.subscriberUids = subscriberUids;
        this.condition = getCondition.call(null, condition);
    }

    getSubscriberIds() {
        return this.subscriberUids;
    }

    pushCourses2Wechat(info) {
        if (!this.condition.matchCondition(info)) {
            return;
        }

        let s = convert2Markdown(info);
        this.push2Wechat(s);
    }

    pushReserveResult2Wechat(result) {
        if (!Array.isArray(result) || result.length === 0) {
            return;
        }
        
        this.push2Wechat(result.join('\n'));
    }

    push2Wechat(s) {
        let options = {
            url: WECHAT_PUSH_URL,
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

function convert2Markdown(info) {
    let title =  '| 是否可预定 | 场地 | 时间                      | 费用 | 备注                         |\n' +
                '| ---------- | ---- | ------------------------- | ---- | ---------------------------- |\n';

    let buffer = '';
    for (let stock of info.instock) {
        buffer += `| <font color="red">是</font> | ${stock.site} | ${stock.date}${stock.weekday} ${stock.sessiones.map(session => session.startHour + ':00-' + session.endHour + ':00').join(',')} | ${stock.sessiones.map(session => session.fee).join(',')} | - |\n`;
    }

    for (let stock of info.outstock) {
        buffer += `| 否 | ${stock.site} | - | - | 当日可预约时间：${stock.availableHours.map(h => `${h}:00-${h+1}:00`).join(',')} |\n`;   
    }

    let tips = info.instock.length > 0 ? '<font color="red" size=5>有可预约的场次</font>\n\n' : '<font size=5>没有可预约的场次</font>\n\n'
    buffer = tips + title + buffer;

    return buffer;
}

module.exports = Notifier;