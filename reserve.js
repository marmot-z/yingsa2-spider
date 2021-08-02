const request = require('request');
const {getReserveStrategy} = require('./reserve-strategy');

class Reserver {
    async placeOrder(strategyAlias, couldBeReserves) {
        let strategy = getReserveStrategy(strategyAlias);
        let totalReserves = strategy.determineMatchReserves(couldBeReserves);

        let reservationResult = [];
        for (let reserve of totalReserves) {
            let reservationMsg = await this.doPlaceOrder(reserve);
            reservationResult.push(reservationMsg);
        }

        return reservationResult;
    }

    async doPlaceOrder(totalReserves) {
        // 1.获取详情页面token
        // 2.调用订单确定接口
        // 3.调用订单下单接口
        // 4.返回订单下单结果
    }
}

module.exports = Reserver;