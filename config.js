const yaml = require('js-yaml');
const fs = require('fs');
const cron = require('node-cron');
const {VALID_STRATEGY_SET} = require('./reserve-strategy');
const {VALID_CONDITION_SET} = require('./notify-condition');

const DEFAULT_CRON_EXPRESSION = '0 0 10-20/1 * * *';
const DEFAULT_INTERESTED_SITES = ['9'];
const DEFAULT_INTERESTED_START_HOUR = 18;
const DEFAULT_INTERESTED_END_HOUR = 20;
const DEFAULT_AUTO_REVERSE_STRATEGY = 'no';
const DEFAULT_NOTIFY_CONDITION = 'instock';
const DEFAULT_FILE_ENCODING = 'utf8';


class Configuration {
    constructor(filePath) {
        if (!fs.existsSync(filePath)) {
            throw new Error(`${filePath} 文件不存在`);
        }

        let content = fs.readFileSync(filePath, DEFAULT_FILE_ENCODING);
        this.doc = yaml.load(content);

        this.validate();
    }

    validate() {
        // cron表达式是否合法
        if (this.doc.cron && !cron.validate(this.doc.cron)) {
            throw new Error('不合法的cron表达式:' + this.doc.cron);
        }

        // 必填参数是否填写（phoneNum, password, appToken, subscriberUids）
        if (!isValidPhoneNum(this.doc.user.phoneNum)) {
            throw new Error('不合法的user.phoneNum:' + this.doc.user.phoneNum);
        }

        if (!this.doc.user.password) {
            throw new Error('不合法的user.password:' + this.doc.user.password);
        }

        if (!isValidAppToken(this.doc.notify.appToken)) {
            throw new Error('不合法的notify.appToken:' + this.doc.notify.appToken);
        }

        if (!isValidSubscriberUids(this.doc.notify.subscriberUids)) {
            throw new Error('不合法的notify.subscriberUids:' + this.doc.notify.subscriberUids);
        }

        // 场次编码是否合法
        if (!isValidSites(this.doc.interested.sites)) {
            throw new Error('不合法的interested.sites:' + this.doc.interested.sites); 
        }

        // 开始时间和结束时间是否合法
        if (!isValidHour(this.doc.interested.startHour)) {
            throw new Error('不合法的interested.startHour:' + this.doc.interested.startHour);
        }

        if (!isValidHour(this.doc.interested.endHour)) {
            throw new Error('不合法的interested.endHour:' + this.doc.interested.endHour);
        }

        if (this.doc.interested.startHour >= this.doc.interested.endHour) {
            throw new Error(`interested.startHour(${this.doc.interested.startHour})不能大于等于interested.endHour(${this.doc.interested.endHour})`);
        }

        // 策略别名是否合法
        if (this.doc.autoReserve.strategy && !isValidStrategy(this.doc.autoReserve.strategy)) {
            throw new Error('不合法的autoReverse.strategy:' + this.doc.autoReserve.strategy);
        }

        // 推送条件是否合法
        if (this.doc.notify.condition && !isValidCondition(this.doc.notify.condition)) {
            throw new Error('不合法的notify.condition:' + this.doc.notify.condition);
        }
    }

    getCronExpression() {
        return this.doc.cron ? this.doc.cron : DEFAULT_CRON_EXPRESSION;
    }

    getPhoneNum() {
        return this.doc.user.phoneNum;
    }

    getPassword() {
        return this.doc.user.password; 
    }

    getInterestedSites() {
        return this.doc.interested.sites ? 
                this.doc.interested.sites.map(site => typeof site === 'string' ? site : new String(site)) : 
                DEFAULT_INTERESTED_SITES;
    }

    getInterestedStartHour() {
        return this.doc.interested.startHour ? this.doc.interested.startHour : DEFAULT_INTERESTED_START_HOUR;
    }

    getInterestedEndHour() {
        return this.doc.interested.endHour ? this.doc.interested.endHour : DEFAULT_INTERESTED_END_HOUR;
    }

    getAutoReserveStrategy() {
        return this.doc.autoReverse.strategy ? this.doc.autoReverse.strategy : DEFAULT_AUTO_REVERSE_STRATEGY;
    }

    getAppToken() {
        return this.doc.notify.appToken; 
    }

    getSubscriberUids() {
        return this.doc.notify.subscriberUids;
    }

    getNotifyCondition() {
        return this.doc.notify.condition ? this.doc.notify.condition.toLowerCase() : DEFAULT_NOTIFY_CONDITION;
    }
}

function isValidPhoneNum(phoneNum) {
    return phoneNum ? /^1[3456789]\d{9}$/.test(phoneNum) : false;
}

function isValidAppToken(appToken) {
    return appToken ? appToken.startsWith('AT_') : false;
}

function isValidSubscriberUids(subscriberUids) {
    return Array.isArray(subscriberUids) ? 
            subscriberUids.every(uid => uid && uid.startsWith('UID_')) : 
            false;
}

const VALID_SITES = ['S', 'A', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
function isValidSites(sites) {
    return Array.isArray(sites) ?
            sites.map(site => typeof site === 'string' ? site : new String(site))
                .every(site => VALID_SITES.find(s => s === site.toUpperCase())) : 
            false;
}

function isValidHour(hour) {
    return hour && typeof hour === 'number' ? 
            hour >= 0 && hour <= 24 : 
            false;
}

function isValidStrategy(strategy) {
    return strategy && typeof strategy === 'string' ? 
            VALID_STRATEGY_SET.find(s => s === strategy.toLowerCase()) :
            false;
}

function isValidCondition(condition) {
    return condition && typeof condition === 'string' ?
            VALID_CONDITION_SET.find(c => c === condition.toLowerCase()) :
            false;
}

module.exports.Configuration = Configuration;
module.exports.VALID_SITES = VALID_SITES;