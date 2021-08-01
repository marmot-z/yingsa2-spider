const yaml = require('js-yaml');
const fs = require('fs');

const DEFAULT_CRON_EXPRESSION = '0 0 10-20/1 * * *';
const DEFAULT_INTERESTED_SITE = 9;
const DEFAULT_INTERESTED_START_HOUR = 18;
const DEFAULT_INTERESTED_END_HOUR = 20;
const DEFAULT_FILE_ENCODING = 'utf8';


class Configuration {
    constructor(filePath) {
        if (!fs.existsSync(filePath)) {
            throw new Error(`${filePath} 文件不存在`);
        }

        let content = fs.readFileSync(filePath, DEFAULT_FILE_ENCODING);
        this.doc = yaml.load(content);
    }

    getCronExpression() {
        return this.doc.cron ? this.doc.cron : DEFAULT_CRON_EXPRESSION;
    }

    getPhoneNum() {
        if (!this.doc.user.phoneNum) {
            throw new Error('user.phoneNum 没有配置');
        }

        return this.doc.user.phoneNum;
    }

    getPassword() {
        if (!this.doc.user.password) {
            throw new Error('user.password 没有配置');
        }

        return this.doc.user.password; 
    }

    getInterestedSite() {
        return this.interested.site ? this.interested.site : DEFAULT_INTERESTED_SITE;
    }

    getInterestedStartHour() {
        return this.interested.startHour ? this.interested.startHour : DEFAULT_INTERESTED_START_HOUR;
    }

    getInterestedEndHour() {
        return this.interested.endHour ? this.interested.endHour : DEFAULT_INTERESTED_END_HOUR;
    }

    getAppToken() {
        if (!this.doc.notifier.appToken) {
            throw new Error('notifier.appToken 没有配置');
        }

        return this.doc.notifier.appToken; 
    }

    getSubscriberUids() {
        if (!this.doc.notifier.subscriberUids ||
            !Array.isArray(this.doc.notifier.subscriberUids)) {
            throw new Error('notifier.subscriberUids 没有配置');
        }

        return this.doc.notifier.subscriberUids;
    }
}

module.exports = Configuration;