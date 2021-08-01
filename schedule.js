const cron = require('node-cron');

class Scheduler {
    constructor(cronExpression, fn) {
        if (!cron.validate(cronExpression)) {
            throw new Error('不合法的cron表达式：' + cronExpression);
        }

        if (typeof fn !== 'function') {
            throw new Error('fn必须是可运行的函数');
        }

        this.task = cron.schedule(cronExpression, this.wrapper(fn), {
            scheduled: false,
            timezone: 'Asia/Shanghai'
        });
    }

    wrapper(fn) {
        return () => {
            try {
                fn.call(null);
            } catch(e) {
                console.error(e);
            }
        };
    }

    start() {
        this.task.start();
    }

    stop() {
        this.task.stop();
    }
}

module.exports = Scheduler;