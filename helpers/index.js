var crypto = require('crypto')
  , config = require('../config').config;

/*
 * helpers
 */

// format date
exports.format_date = function(d){
  if(typeof d != 'object'){
    return {};
  }

  function fix(num){
    return (num < 10)? '0' + num : num.toString();
  }

	var year = d.getFullYear()
    , month = d.getMonth() + 1
    , date = d.getDate()
    , day = d.getDay()
    , hours = d.getHours()
    , minutes = d.getMinutes()
    , seconds = d.getSeconds();

  var months = ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月']
    , months_en = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
    , months_abbr = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    , days = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
    , days_en = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thurday', 'Friday', 'Saturday']
    , days_abbr = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return {
    year: year,
    month: fix(month),
    date: fix(date),
    day: day,
    hours: fix(hours),
    minutes: fix(minutes),
    seconds: fix(seconds),
    month_name: months[month - 1],
    month_name_en: months_en[month - 1],
    month_abbr: months_abbr[month - 1],
    day_name: days[day],
    day_name_en: days_en[day],
    day_abbr: days_abbr[day],
    normal: fix(month) + '-' + fix(date),
    full_date: year + '-' + fix(month) + '-' + fix(date),
    time: fix(hours) + ':' + fix(minutes) + ':' + fix(seconds),
    full: year + '-' + fix(month) + '-' + fix(date) + ' ' + fix(hours) + ':' + fix(minutes) + ':' + fix(seconds),
    more: year + '/' + fix(month) + '/' + fix(date) + ' ' + fix(hours) + ':' + fix(minutes),
    less: fix(month) + '/' + fix(date) + ' ' + fix(hours) + ':' + fix(minutes),
    short: fix(date) + ' ' + months_abbr[month - 1] + ' ' + year + ' ' + fix(hours) + ':' + fix(minutes),
    mini: fix(month) + '/' + fix(date)
  };
};

exports.string_length = function(str) {
  return typeof str === "string" ? str.length + str.replace(/[\x00-\x7f]/g, '').length + 1 >> 1 : 0;
};

exports.string_cut = function(str, length) {
  if (typeof str !== "string"){
    return str;
  }
  length += length;
  for ( var n = 0, L = str.length; n < L && length > 0; n++) {
    length -= str.charCodeAt(n) > 127 ? 2 : 1;
  }
  return str.substr(0, n);
};

exports.brief_cut = function(text, length){
  if (typeof text !== "string"){
    return text;
  }

var brief = ''
  , link_ref = '';

// 切分链接引用
var slice_at = text.search(/\n *\[\d{0,3}\]: (http:\/\/)/);
if(slice_at != -1){
  link_ref = text.substring(slice_at, text.length);
  brief = text.substr(0, slice_at);
}
else{
  brief = text;
}

// 切分简介
if(brief.length > length){
    var expect_at = brief.indexOf('\n', length);
    if(expect_at - length > 100){
        expect_at = brief.lastIndexOf('\n', length);
    }
    brief = brief.substr(0, expect_at);
    brief += '\n\n...';
}

  return brief + link_ref;
}

exports.brief_filter = function(str){
  str = str
    .replace(/&/g, '&amp;')
    .replace(/\</g, '&lt;')
    .replace(/\>/g, '&gt;')
    .replace(/\n/g, '<br>');
  return str;
};

// 私钥加密算法
exports.encrypt = function (str, secret){
  if(typeof str != 'string') return '';
  var cipher = crypto.createCipher('aes128', secret);
  var enc = cipher.update(str,'utf8','hex');
  enc += cipher.final('hex');
  return enc;
}

exports.decrypt = function (str, secret){
  if(typeof str != 'string') return '';
  var decipher = crypto.createDecipher('aes128', secret);
  var dec = decipher.update(str,'hex','utf8');
  dec += decipher.final('utf8');
  return dec;
}
