const Spider = require('./spider');
const Notifier = require('./notifier');
const Scheduler = require('./schedule');
const Configuration = require('./config');

const siteCodeOrders = ['S', 'A', '1', '2', '3', '4', '5', '6', '7', '8', '9'];

/**
 * 
 * @param {Array} everyDayInfos 每日预定信息数组
 * @param {String} site 场地编号
 * @param {Number} startHour 开始时间
 * @param {Number} endHour 结束时间
 * @returns 
 */
function findAvailableReservationTime(everyDayInfos, site = '9', startHour = 18, endHour = 20) {
    let expectHours = range(startHour, endHour - 1);
    let couldReservation = false;

    let message = '| 是否可预约 | 场地 | 时间 | 备注 |\n' +
                   '| - | - | - | - |\n';
    everyDayInfos.forEach(dayInfo => {
        if (dayInfo.courseInfos && dayInfo.courseInfos.length > 0) {
            let index = siteCodeOrders.indexOf(site.toUpperCase());

            let availableHours = dayInfo.courseInfos[index]
                .filter(siteInfo => siteInfo.available)
                .map(siteInfo => siteInfo.startHour);

            if (include(expectHours, availableHours))  {
                couldReservation = true;
                message += `| <font color="red">是</font> | ${site} | ${dayInfo.date}${dayInfo.weekday} ${startHour}:00-${endHour}:00 |  |\n`;
            } else {
                message += `| 否 | ${site}|${dayInfo.date}${dayInfo.weekday} ${startHour}:00-${endHour}:00 | 当日可预约时间：${availableHours.map(h => `${h}:00-${h+1}:00`).join(',')} |\n`;
            }
        }
    });

    message = (couldReservation ? '<font color="red" size=5>有可预约的场次</font>\n' : '<font size=5>没有可预约的场次</font>\n\n') + message;
    console.log(message);

    return message;
}

function range(start, end) {
    return Array(end - start + 1).fill().map((_, idx) => start + idx)
}

/**
 * 数组arr是否为数组baseArr的子集
 * 
 * @param {Array} arr      数组1
 * @param {Array} baseArr  数组2
 * @return {Boolean} baseArr包含arr返回true，否则返回false
 */
function include(arr, baseArr) {
    return arr.every(val => baseArr.includes(val));
}

(async () => {
    let config = new Configuration('./config.yaml');
    let notifier = new Notifier(config.getAppToken(), config.getSubscriberUids());
    let spider = new Spider(config.getPhoneNum(), config.getPassword()); 
    let scheduler = new Scheduler(config.getCronExpression(), () => {
        spider.fetch()
            .then(async (v) => {
                let message = findAvailableReservationTime(v);
                let body = await notifier.push2Wechat(message);
            })
            .catch(console.error);
    });

    process.on('exit', function(code) {
        scheduler.stop();
    });
    scheduler.start();
})();