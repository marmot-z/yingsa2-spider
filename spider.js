const cheerio = require('cheerio');
const request = require('request');

class HtmlParser {
    constructor(phoneNum, password) {
        this.phoneNum = phoneNum;
        this.password = password;

        this.isLogin = false;
        this.loginCookie = null;
    }

    async login() {
        let options = {
            url: `${HtmlParser.loginURL}?_=${new Date().getTime()}`,
            method: 'POST',
            headers: {
                'content-type': 'application/x-www-form-urlencoded',
                origin: HtmlParser.host,
                referer: HtmlParser.host + 'login'
            },
            formData: {
                username: this.phoneNum,
                password: this.password
            }
        };

        return new Promise((resolve, reject) => {
            request(options, (err, response) => {
                if (err || response.statusCode != 200) {
                    reject(err || response);
                    return;
                }

                this.isLogin = true;

                let cookies = response.headers['set-cookie'];
                resolve(cookies.map(cookie => {
                    if (cookie) return cookie.split(';')[0];
                }).join('; '));
            });
        })
    }

    async loadIndexHtml() {
        if (!this.isLogin) {
            try {
                this.loginCookie = await this.login();
            } catch(e) {
                console.error('登录失败', e);
                throw new Error('登录失败');
            }
        }

        let html = await this.loadPage(HtmlParser.indexURL);
        let detailPages = this.parseIndexHtml(html);

        for (let page of detailPages) {
            if (page.url !== null) {
                page.courseInfos = await this.loadDetailHtml(page.url);
            }
        }

        return detailPages;
    }

    loadPage(url) {
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

                resolve(response.body);
            });
        });
    }

    parseIndexHtml(html) {
        let $ = cheerio.load(html);
        let $ul = $('body > div.detail-main > div.book.borderBottom1px > ul');

        return $ul.children('.borderBottom1px').toArray()
            .map(li => {
                let $li = $(li);
                return {
                    date: $li.children('.date').html(),
                    weekday: $li.children('.weekday').text().trim(),
                    url: $li.children('a').hasClass('disable') ? null : HtmlParser.host + $li.children('a').attr('href')
                }
            });
    }

    async loadDetailHtml(url) {
        let html = await this.loadPage(url);
        let sites = this.parseDetailHtml(html);
        return sites;
    }

    parseDetailHtml(html) {
        let $ = cheerio.load(html);
        let $bookList = $('#scroller > div');

        return $bookList.children('ul').toArray().map(ul => {
            return $(ul).children('li').toArray().map(li => {
                let $li = $(li);
                let [_, siteCode, fee, startHour, endHour] = 
                        /(\w)[^,]{2},\w{1,2},(\d{1,3}),(\d{1,2}):00-(\d{1,2}):00/.exec($li.attr('course_content'));

                return {
                    siteCode: siteCode,
                    fee: Number.parseInt(fee),
                    startHour: Number.parseInt(startHour),
                    endHour: Number.parseInt(endHour),
                    available: $li.hasClass('available')
                }
            });
        });
    }
}

HtmlParser.host = 'https://m.quyundong.com/';
HtmlParser.indexURL = HtmlParser.host + 'court/detail?id=22185&cid=1';
HtmlParser.loginURL = HtmlParser.host + 'login/dologin';

const Spider = HtmlParser;
Spider.prototype.fetch = HtmlParser.prototype.loadIndexHtml;

module.exports = Spider;