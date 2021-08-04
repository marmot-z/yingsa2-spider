class Condition {
    matchCondition(info) {
        return info.instock.length > 0 || info.outstock.length > 0;
    } 
}

class AlwaysCondition extends Condition {
    matchCondition(info) {
        return super.matchCondition(info);
    }
}

class InstockCondition extends Condition {
    matchCondition(info) {
        return info.instock.length > 0;
    }
}

class NeverCondition extends Condition {
    matchCondition(info) {
        return false;
    }
}

function getCondition(condition) {
    let conditionClazz = CONDITION_MAP[condition];
    
    if (!conditionClazz) {
        throw new Error(`无 ${condition} condition`);
    }

    return new conditionClazz();
}

const CONDITION_MAP = {
    'always': AlwaysCondition,
    'instock': InstockCondition,
    'never': NeverCondition
};

module.exports.getCondition = getCondition;
module.exports.VALID_CONDITION_SET = Object.keys(CONDITION_MAP);