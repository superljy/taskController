/**
 * 时间格式化 
 * 例如 : 'YYYY-MM-DD hh:mm:ss' 表示 年-月-日 时:分:秒 注意大小写
 * @param {String (想要格式化的格式)} format 
 */
const timeFormat = (format) => {
    let date = new Date();
    /**
     * 先设置一个时间对象,存储获取到的时间信息
     * 键名为即将用到的正则匹配词 如:M+ 表示用在正则时匹配1到多个M
     */
    let timeData = {
        'M+': date.getMonth() + 1,
        'D+': date.getDate(),
        'h+': date.getHours(),
        'm+': date.getMinutes(),
        's+': date.getSeconds()
    }
    /**
     * 判断是否需要显示年份
     * 后面使用substring截取是为了应对当输入格式为只有年份的后两位时 如2019 -> 19
     */
    if (/(Y+)/.test(format)) {
        format = format.replace(RegExp.$1, (`${date.getFullYear()}`).substring(4 - RegExp.$1.length));
    }
    for (let time in timeData) {
        if (new RegExp(`(${time})`).test(format)) {
            /**
             * 当数字为个位数时前面补0
             * 使用00拼接是因为当时间为两位数时将截取前面两位 所以需要两个0来占位
             * 时间为个位数的时候从第一位开始截取 达到前面补0的效果
             */
            format = format.replace(RegExp.$1, (`00${timeData[time]}`).substring(`${timeData[time]}`.length));
        }
    }
    return format;
}

module.exports = timeFormat;