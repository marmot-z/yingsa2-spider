const Spider = require('./spider');
const Notifier = require('./notifier');
const Scheduler = require('./schedule');
const {Configuration, VALID_SITES} = require('./config');
const Reserver = require('./reserve');

/**
 * 获取预约信息
 * 
 * @param {Array} everyDayInfos 每日预定信息数组
 * @param {Array} sites 场地编号
 * @param {Number} startHour 开始时间
 * @param {Number} endHour 结束时间
 * @returns 
 */
function findAvailableReservationTime(everyDayInfos, sites, startHour, endHour) {
    let expectHours = range(startHour, endHour - 1);
    let result = {'instock': [], 'outstock': []};

    everyDayInfos.forEach(dayInfo => {
        if (dayInfo.courseInfos && dayInfo.courseInfos.length > 0) {
            for (let site of sites) {
                let index = VALID_SITES.indexOf(site.toUpperCase());

                let availableCourses = dayInfo.courseInfos[index].filter(siteInfo => siteInfo.available);
                let availableHours =  availableCourses.map(course => course.startHour);
                let stockInfo = {
                    url: dayInfo.url,
                    token: dayInfo.token,
                    bookDate: dayInfo.bookDate,
                    site: site,
                    date: dayInfo.date,
                    weekday: dayInfo.weekday,
                    availableHours: availableHours
                };

                if (include(expectHours, availableHours)) {
                    let sessiones = availableCourses.filter(course => course.startHour >= startHour && course.endHour <= endHour)
                                    .map(course => {
                                        return {
                                            fee: course.fee,
                                            goodsId: course.goodsId,
                                            startHour: course.startHour,
                                            endHour: course.endHour
                                        };
                                    });
                    stockInfo.sessiones = sessiones;

                    result.instock.push(stockInfo);
                } else {
                    result.outstock.push(stockInfo);
                }
            }
        }
    });

    return result;
}

/**
 * 生成一个最小值为${start}，最大值为${end}，长度为${end-start}的连续数组
 * 
 * @param {Number} start 开始数值(包含)
 * @param {Number} end 结束数值(包含)
 * @return 最小值为${start}，最大值为${end}，长度为${end-start}的连续数组
 */
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

(() => {
    try {
        let config = new Configuration('./config.yaml');
        let notifier = new Notifier(config.getAppToken(), config.getSubscriberUids(), config.getNotifyCondition());
        let spider = new Spider(config.getPhoneNum(), config.getPassword()); 
        let reserver = new Reserver();
        let scheduler = new Scheduler(config.getCronExpression(), () => {
            console.info(new Date(), '定时任务调用开始');

            spider.fetch()
                .then(async (v) => {
                    let result = findAvailableReservationTime(v, config.getInterestedSites(), 
                                        config.getInterestedStartHour(), config.getInterestedEndHour());
                    notifier.pushCourses2Wechat(result);

                    reserver.setLoginCookie(spider.getLoginCookie());
                    let reserveResult = await reserver.placeOrder(config.getAutoReserveStrategies(), result.instock);
                    notifier.pushReserveResult2Wechat(reserveResult);
                })
                .catch(console.error);
        });

        process.on('exit', function(code) {
            scheduler.stop();
        });
        scheduler.start();

        console.info(new Date(), `您将预定的场次为：${config.getInterestedSites().join(',')}，
                                  时间为：[${config.getInterestedStartHour()}-${config.getInterestedEndHour()}]，
                                  预约策略为：${config.getAutoReserveStrategies()}，
                                  推送策略为：${config.getNotifyCondition()}`);
        console.info(new Date(), 'yingsa2-spider 启动成功');
    } catch(e) {
        console.error(e);
        process.exit();
    }
})();