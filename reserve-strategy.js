const DateUtils = require('./date-util');

class Strategy {

    /**
     * 获取最终要预约的场地信息数组
     * 
     * @param {Array} reservationes 可以预约的场地信息数组
     * @return {Array} 最终要预约的场地信息数组，没有符合条件的预约场地则返回空数组
     */
    determineMatchReservationes(reservationes) {
        if (reservationes == null || reservationes.length === 0) {
            return [];
        }

        return reservationes.filter(this.match.bind(this));
    }

    /**
     * 预约信息是否符合策略逻辑
     * 
     * @param {Object} reservation 预约信息
     * @return 符合返回true，否则false
     */
    match(reservation) {
        throw new Error('Unsupport operation.');
    }
}

class NoStrategy extends Strategy {
    match(reservation) {
        return false;
    }
}

class FirstStrategy extends Strategy {
    index = 0;

    match(reservation) {
        return !this.index++;
    }
}

class WeekendFirstStrategy extends Strategy {
    index = 0;

    match(reservation) {
        return this.isWeekend(reservation) && !this.index++;
    }

    isWeekend(reservation) {
        return DateUtils.isWeekend(new Date(reservation.bookDate * 1000));
    }
}

class WorkdayFirstStrategy extends Strategy {
    index = 0;

    match(reservation) {
        return this.isWorkday(reservation) && !this.index++;
    }

    isWorkday(reservation) {
        return DateUtils.isWorkday(new Date(reservation.bookDate * 1000));
    }
}

class LastStrategy extends Strategy {
    determineMatchReservationes(reservationes) {
        this.length = reservationes === null ? 0 :reservationes.length;
        return super.determineMatchReservationes(reservationes);
    }

    match(reservation) {
        return !--this.length;
    }
}

class AllStrategy extends Strategy {
    match(reservation) {
        return true;
    }
}

class RandomStrategy extends Strategy {
    determineMatchReservationes(reservationes) {
        let length = reservationes === null ? 0 :reservationes.length;
        this.index = Math.ceil(Math.random() * length);
        return super.determineMatchReservationes(reservationes);
    }

    match(reservation) {
        return !--this.index;
    }
}

class WeekStrategy extends Strategy {
    getDayIndex() {
        return -1;
    }

    match(reservation) {
        let date =  new Date(reservation.bookDate * 1000);
        return date.getDay() === this.getDayIndex(); 
    }
}

class MondayStrategy extends WeekStrategy {
    getDayIndex() {
        return 1;
    }
}

class TuesdayStrategy extends WeekStrategy {
    getDayIndex() {
        return 2;
    }
}

class WednesdayStrategy extends WeekStrategy {
    getDayIndex() {
        return 3;
    }
}

class ThursdayStrategy extends WeekStrategy {
    getDayIndex() {
        return 4;
    }
}

class FridayStrategy extends WeekStrategy {
    getDayIndex() {
        return 5;
    }
}

class SaturdayStrategy extends WeekStrategy {
    getDayIndex() {
        return 6;
    }
}

class SundayStrategy extends WeekStrategy {
    getDayIndex() {
        return 0;
    }
}

class StrategyChain {
    constructor(strategiesAlias) {
        this.strategies = strategiesAlias.map(getReserveStrategy);
    }

    determineMatchReservationes(reservationes) {
        let result = [];

        this.strategies.forEach(strategy => {
            let totalReservationes = strategy.determineMatchReservationes(reservationes);
            result.push(...totalReservationes);
        });
        
        return distinct(result);
    }
}

const STRATEGY_MAP = {
    'no': NoStrategy,
    'first': FirstStrategy,
    'weekendFirst': WeekendFirstStrategy,
    'workdayFirst': WorkdayFirstStrategy,
    'last': LastStrategy,
    'all': AllStrategy,
    'random': RandomStrategy,
    'monday': MondayStrategy,
    'tuesday': TuesdayStrategy,
    'wednesday': WednesdayStrategy,
    'thursday': ThursdayStrategy,
    'friday': FridayStrategy,
    'saturday': SaturdayStrategy,
    'sunday': SundayStrategy
};

/**
 * 根据策略名称获取策略类
 * 
 * @param {String} strategyAlias 策略别名
 * @returns 策略实例
 */
function getReserveStrategy(strategyAlias) {
    if (!strategyAlias) {
        throw new Error(`预约策略不能为空`);
    }

    let strategies = Object.keys(STRATEGY_MAP);
    let i = strategies.findIndex(strategy => strategy === strategyAlias);

    if (i === -1) {
        throw new Error(`不存在 ${strategyAlias} 预约策略`);
    }

    return new STRATEGY_MAP[strategies[i]]();
}

function distinct(arr) {
    let result = [];
    let map = new Map();

    for (let item of arr) {
        let uniqueKey = item.site + item.date;
        if (!map.get(uniqueKey)) {
            result.push(item); 
            map.set(uniqueKey, true);
        }
    }

    return result;
}

module.exports.StrategyChain = StrategyChain;
module.exports.VALID_STRATEGY_SET = Object.keys(STRATEGY_MAP);