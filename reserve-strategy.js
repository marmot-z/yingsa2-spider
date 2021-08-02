class Strategy {

    /**
     * 获取最终要预约的场地信息数组
     * 
     * @param {Array} couldBeReserves 可以预约的场地信息数组
     * @return {Array} 最终要预约的场地信息数组，没有符合条件的预约场地则返回空数组
     */
    determineMatchReserves(couldBeReserves) {
        if (couldBeReserves == null || couldBeReserves.length === 0) {
            return [];
        }

        return couldBeReserves.filter(this.match);
    }

    /**
     * 预约信息是否符合策略逻辑
     * 
     * @param {Object} reserve 预约信息
     * @return 符合返回true，否则false
     */
    match(reserve) {
        throw new Error('Unsupport operation.');
    }
}

class NoStrategy extends Strategy {
    match(reserve) {
        return false;
    }
}

class FirstStrategy extends Strategy {
    index = 1;

    match(reserve) {
        return index++ === 1;
    }
}

class WeekendFirstStrategy extends Strategy {
    index = 0;

    match(reserve) {
        return isWeekend(reserve) && !index++;
    }

    isWeekend(reserve) {
        return false;
    }
}

class WorkdayFirstStrategy extends Strategy {
    index = 0;

    match(reserve) {
        return isWorkday(reserve) && !index++;
    }

    isWorkday(reserve) {
        return false;
    }
}

class LastStrategy extends Strategy {
    determineMatchReserves(couldBeReserves) {
        this.length = couldBeReserves === null ? 0 :couldBeReserves.length;
        return super.determineMatchReserves(couldBeReserves);
    }

    match(reserve) {
        return !--this.length;
    }
}

class AllStrategy extends Strategy {
    match(reserve) {
        return true;
    }
}

class RandomStrategy extends Strategy {
    determineMatchReserves(couldBeReserves) {
        let length = couldBeReserves === null ? 0 :couldBeReserves.length;
        this.index = Math.ceil(Math.random() * length);
        return super.determineMatchReserves(couldBeReserves);
    }

    match(reserve) {
        return !--this.index;
    }
}

const STRATEGY_MAP = {
    'no': NoStrategy,
    'first': FirstStrategy,
    'weekendFirst': WeekendFirstStrategy,
    'workdayFirst': WorkdayFirstStrategy,
    'last': LastStrategy,
    'all': AllStrategy,
    'radom': RandomStrategy
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

module.exports.getReserveStrategy = getReserveStrategy;
module.exports.VALID_STRATEGY_SET = Object.keys(STRATEGY_MAP);