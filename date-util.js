class DateUtils {
    static today() {
        return new Date();
    }

    static getDay(date) {
        // 08月1日
        // 判断是否为第二年
    }

    static isWeekend(date) {
        if (!date | !(date instanceof Date)) {
            throw new Error('非法的日期:' + date);
        }

        return date.getDay() === 0 || date.getDay() === 6;
    }

    static isWorkday(date) {
        if (!date | !(date instanceof Date)) {
            throw new Error('非法的日期:' + date);
        }

        return date.getDay() >= 1 && date.getDay() <= 5;
    }
}

module.exports = DateUtils;