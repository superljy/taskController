/**
 * NSB蓝任务触发任务运行简陋监控
 * Created by August
 */

const express = require('express');
const fs = require('fs');
const watch = require('node-watch');
const {
    exec
} = require('child_process');
const app = express();
const timeFormat = require('./utils/utils');

app.listen('3456', () => {
    console.log('Monitoring...');
});


/**
 * 使用node-watch模块 方便监控文件变化 并且这个封装好的模块已经把防抖等操作加入 减少了因为不同操作系统底层api的不一致所产生的不同行为
 * event不同于fs.watch 这里是update和remove 其实差不多对应fs.watch的change和rename
 * filename同样是触发更改的文件
 */
let timeout;
watch('C:/Users/Administrator/AppData/Roaming/NSB/storage/tasks.json', (event, filename) => {
    if (filename && event === 'update') {
        console.log(`[${timeFormat('MM-DD hh:mm:ss')}] `, `Tasks have been changed, wait for 5 minutes..`);
        clearTimeout(timeout);
        timeout = setTimeout(() => {
            fs.readFile(filename, (err, data) => {
                if (err) throw err.message;
                let _data = JSON.parse(data);
                for (let i = 0; i < _data.length; i++) {
                    if (_data[i].site === 'all' || _data[i].method === 'generator') {
                        continue;
                    }
                    /**
                     * Date.parse 将日期时间转换成时间戳格式,parse会忽略毫秒 直接返回000
                     * 把任务创建时间和当前时间都变成时间戳 然后相减作对比 得出的差值除以60*1000 表示换算成分钟数
                     * 当分钟数大于或等于5的时候 表示这个任务最少已经运行了5分钟 可以把它删掉
                     * 把修改过的_data重新写入tasks.json
                     */
                    let taskCreatedTime = Date.parse(new Date(_data[i].date));
                    let now = Date.parse(new Date());
                    let usedMinutes = (now - taskCreatedTime) / (60 * 1000);
                    console.log(`[${timeFormat('MM-DD hh:mm:ss')}] `, _data[i].site, _data[i].method, `Task has been running for ${Math.round(usedMinutes)} minutes...`);
                    if (usedMinutes >= 5) {
                        _data.splice(i, 1);
                    }
                }
                console.log(`[${timeFormat('MM-DD hh:mm:ss')}] `, `You're now have tasks:${_data.length} `, `Deleted tasks:${JSON.parse(data).length-_data.length}`);

                if (_data.length !== JSON.parse(data).length) {
                    fs.writeFile('C:/Users/Administrator/AppData/Roaming/NSB/storage/tasks.json', JSON.stringify(_data), 'utf-8', (err) => {
                        if (err) throw err.message;
                        console.log(`[${timeFormat('MM-DD hh:mm:ss')}] `, 'Deleted tasks running over 5 minutes...')
                    });
                    /**
                     * 因调用bat文件执行shell命令会返回不安全警告,故直接将shell命令在exec中传入执行
                     * TASKKILL /F /IM nsb.exe /T  关闭NSB
                     * ping 127.0.0.1 -w 1000 -n 5 >nul  延迟5秒
                     * start C:\Users\Administrator\AppData\Local\Programs\NSB\NSB.exe  重新启动NSB
                     * 
                     */
                    exec('TASKKILL /F /IM nsb.exe /T', (err, stdout, stderr) => {
                        if (err) throw err.message;
                        console.log(`[${timeFormat('MM-DD hh:mm:ss')}] `, 'Close NSB success...');
                    })
                    setTimeout(() => {
                        exec('start C:/Users/Administrator/AppData/Local/Programs/NSB/NSB.exe', (err, stdout, stderr) => {
                            if (err) throw err.message;
                            console.log(`[${timeFormat('MM-DD hh:mm:ss')}] `, 'Restarted NSB success...');
                        })
                    }, 1000);
                }
            })
        }, 300000);
    }
})