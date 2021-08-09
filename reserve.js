const request = require('request');
const cheerio = require('cheerio');
const {StrategyChain} = require('./reserve-strategy');

const CONFIRM_URL = 'https://m.quyundong.com/order/Confirm';
const DO_CONFIRM_URL = 'https://m.quyundong.com/order/doconfirm';
const ORDER_URL = 'https://m.quyundong.com/myorder/orderList?action=order_get_order_list&page=1&client_time=%s&type=0';

class Reserver {
    async placeOrder(strategiesAlias, reservationes) {
        if (!Array.isArray(reservationes) || reservationes.length == 0) {
            return [];
        }

        // let reserveable = await this.couldReserve();
        // if (!reserveable) {
        //     console.info('当前账户下有未消费/未支付的订单，暂不进行自动预约');
        //     return [];
        // }

        let strategyChain = new StrategyChain(strategiesAlias);
        let totalReservationes = strategyChain.determineMatchReservationes(reservationes);

        let reservaeResult = [];
        for (let reservation of totalReservationes) {
            let reserveMessage = await this.doPlaceOrder(reservation);
            reservaeResult.push(reserveMessage);
        }
        console.log('预约结果：\n' + reservaeResult.join('\n'));

        return reservaeResult;
    }

    async couldReserve() {
        let options = {
            url: ORDER_URL.replace('%s', new Date().getTime()),
            method: 'GET',
            headers: {
                cookie: this.loginCookie
            }
        };

        return new Promise((resolve, reject) => {
            request.get(options, (err, response) => {
                if (err || response.statusCode != 200) {
                    resolve(false);
                    return;
                }

                let result = JSON.parse(response.body);
                if (result.msg != 'success') {
                    resolve(false);
                    return;
                }

                // 订单状态对应关系：
                // 0    待支付 
                // 1    待消费
                // 4    已过期
                // 5    已退款
                let hasNotPayOrder = result.data.some(order => order['order_status'] === '0');
                let hasNotUseOrder = result.data.some(order => order['order_status'] === '1');
                // 只有不存在待支付的订单和待消费的订单时才进行自动预定
                let reserveable = !hasNotPayOrder && !hasNotUseOrder;

                resolve(reserveable);
            });
        });
    }

    async doPlaceOrder(reservation) {
        try {
            // 1.获取详情页token(此处必须重新获取详情页的token，否则接口会提示过期)
            reservation.token = await this.getDetailPageToken(reservation.url);

            // 2.调用订单确认接口
            let confirmPageUrl = this.createConfirmPageUrl(reservation);
            let confirmPageInfo = await this.getConfirmPageInfo(confirmPageUrl);

            // 3.调用订单下单接口(code为1成功，其他失败)
            let result = await this.doConfirm(confirmPageInfo);
            return `预定 ${reservation.date}${reservation.weekday} ${reservation.site}场地 ${reservation.sessiones.map(s => s.startHour + ':00-' + s.endHour + ':00').join(',')} 时间段<font color='red' size=5>成功</font>，订单${result.data['order_no']}在10分钟内有效，请尽快付款`;
        } catch(e) {
            console.error(e);
            return `预定 ${reservation.date}${reservation.weekday} ${reservation.site}场地 ${reservation.sessiones.map(s => s.startHour + ':00-' + s.endHour + ':00').join(',')} 时间段<font color='red' size=5>失败</font>，原因为：${e}`;
        }
    }

    getDetailPageToken(url) {
        let options = {
            url: url,
            method: 'GET',
            headers: {
                cookie: this.loginCookie
            }
        };

        return new Promise((resolve, reject) => {
            request.get(options, (err, response) => {
                if (err || response.statusCode != 200) {
                    reject(err);
                    return;
                }

                let $ = cheerio.load(response.body);
                let token = $('#modalContent > form > div > input[type=hidden]:nth-child(11)').val(); 
                resolve(token);
            });
        });
    }

    createConfirmPageUrl(reservation) {
        let entries = [];
        for (let session of reservation.sessiones) {
            entries.push({k: 'price[]', v: session.fee});
            entries.push({k: 'hour[]', v: session.startHour});    
            entries.push({k: 'course_name[]', v: reservation.site + '号场'});    
            entries.push({k: 'real_time[]', v: `${session.startHour}:00-${session.endHour}:00`});
        }
        entries.push({k: 'allcourse_name', v: 'S号场,A号场,1号场,2号场,3号场,4号场,5号场,6号场,7号场,8号场,9号场,'});
        entries.push({k: 'goods_ids', v: reservation.sessiones.map(s => s.goodsId).join(',')});
        entries.push({k: 'book_date', v: reservation.bookDate});
        entries.push({k: 'court_name', v: '上峰英飒羽毛球馆'});
        entries.push({k: 'category_name', v: '羽毛球'});
        entries.push({k: 'bid', v: '22185'});
        entries.push({k: 'cid', v: '1'});
        entries.push({k: 'order_type', v: '0'});
        entries.push({k: 'relay', v: '0'});
        entries.push({k: 'token', v: reservation.token});

        let queryString = entries.map(({k, v}) => encodeURIComponent(k) + '=' + encodeURIComponent(v)).join('&');
        return CONFIRM_URL + '?' + queryString;
    }

    getConfirmPageInfo(url) {
        let options = {
            url: url,
            method: 'GET',
            headers: {
                cookie: this.loginCookie
            }
        };

        return new Promise((resolve, reject) => {
            request(options, (err, response) => {
                if (err || response.statusCode != 200) {
                    reject(err ? err : response);
                    return;
                }

                resolve(this.parseConfirmPage(response.body));
            })
        });
    }

    parseConfirmPage(html) {
        let $ = cheerio.load(html);

        return {
            token: $('#token').val(),
            hash: $('#J_payHash').val(),
            bid: $('#J_payBid').val(),
            cid: $('#J_payCid').val(),
            actid: $('#J_payActId').val(),
            couponid: $('#coupon_id').val(),
            ticketType: $('#ticket_type').val(),
            relay: $('#relay').val(),
            goodsIds: $('#J_payGoodsId').val()
        };
    }

    doConfirm(info) {
        let queryString = `goods_ids=${info.goodsIds}&act_id=${info.actid}&code=0&bid=${info.bid}&cid=${info.cid}&coupon_id=${info.couponid}&ticket_type=${info.ticketType}&`;
        queryString += `utm_source=&pay_type=&card_no=&relay=${info.relay}&package_type=0&sale_list={}&invoice_id=1&`;
        queryString += `hash=${info.hash}&token=${info.token}&_=${new Date().getTime()}`;

        let url = encodeURI(DO_CONFIRM_URL + '?' + queryString);
        let options = {
            url: url,
            method: 'GET',
            headers: {
                cookie: this.loginCookie
            }
        };

        return new Promise((resolve, reject) => {
            request(options, (err, response) => {
                if (err || response.statusCode != 200) {
                    reject(err ? err : response);
                    return;
                }

                let result = JSON.parse(response.body);
                if (result.code != '1') {
                    reject(result);
                }

                resolve(result);
            });
        });
    }

    setLoginCookie(loginCookie) {
        this.loginCookie = loginCookie;
    } 
}

module.exports = Reserver;