console.log('/////////////////////UPBIT/////////////////////');
var mysql = require('mysql');
var request = require("request");
var common = require('../_lib/common.js');

var connection = null;

var marketCodeList = [];
var tradeData = {};
var tradingList = [];
var tickerData = {};

var currentMarketIndex = 0;
var compareTime = 0;

var balance = 10000000;
var purchaseAmount = 100000;

const STATUS_INIT_DATA = 0;
const STATUS_CONNECT_DB = 1;
const STATUS_LOAD_MARKET_DATA = 2;
const STATUS_LOAD_DATA = 3;
const STATUS_PURCHASE_CHECK = 4;
const STATUS_LOAD_TICKER_DATA = 5;
const STATUS_END = 6;
var CURRENT_STATUS = STATUS_INIT_DATA;

LoadStatus();

function LoadStatus() {
    switch (CURRENT_STATUS++) {
        case STATUS_INIT_DATA: {
            InitData();
        }
            break;
        case STATUS_CONNECT_DB: {
            //ConnectDatabase();
            LoadStatus();
        }
            break;
        case STATUS_LOAD_MARKET_DATA: {
            GetMarketCode();
        }
            break;
        case STATUS_LOAD_DATA: {
            CURRENT_STATUS = STATUS_LOAD_TICKER_DATA;
            LoadStatus();
            // console.log(marketCodeList[currentMarketIndex].korean_name);
            // GetCandleMinute(marketCodeList[currentMarketIndex].market, null);
        }
            break;
        case STATUS_PURCHASE_CHECK: {
            coinCheck(marketCodeList[currentMarketIndex].market);
        }
            break;
        case STATUS_LOAD_TICKER_DATA: {
            LoadTickerData(marketCodeList[currentMarketIndex].market);
        }
            break;
        case STATUS_END: {
            programEnd();
        }
            break;
    }
}

function InitData() {
    compareTime = new Date();
    compareTime.setDate(compareTime.getDate() - 1);

    LoadStatus();
}

function ConnectDatabase() {
    var mysqlConfig = {
        host: '',
        user: 'xdea',
        password: '',
        port: 3306,
        database: 'upbit',
        multipleStatements: true
    }

    connection = mysql.createConnection(mysqlConfig);
    connection.connect();

    LoadStatus();
}

function GetMarketCode() {
    var options = {
        method: 'GET',
        url: 'https://api.upbit.com/v1/market/all'
    };

    request(options, (error, response, body) => {
        if (error) throw new Error(error);

        var data = JSON.parse(body);

        data.forEach((item) => {
            if (item.market.includes('KRW-')) {
                marketCodeList.push(item);
                tradeData[item.market] = [];
                tickerData[item.market] = [];
            }
        });

        LoadStatus();

        // connection.query('SELECT * FROM marketlist', (error, results, fields) => {
        //     if (error) throw error;

        //     data.forEach(async (item) => {
        //         if (item.market.includes('KRW-')) {
        //             var isExist = false;
        //             for (var i = 0; i < results.length; i++) {
        //                 if (item.market == results[i].market) {
        //                     isExist = true;
        //                     break;
        //                 }   
        //             }

        //             if (isExist == false) {
        //                 connection.query('INSERT INTO marketlist SET ?', item, function(error, results, fields) {
        //                     console.log(item);
        //                 });
        //             }
        //         }
        //     });

        //     connection.query('SELECT * FROM marketlist', (error, results, fields) => {
        //         if (error) throw error;

        //         results.forEach((item) => {
        //             marketCodeList.push(item);
        //             tradeData[item.market] = [];
        //             tickerData[item.market] = [];
        //         });

        //         LoadStatus();   
        //     });
        // });
    });
}

function GetCandleMinute(marketCode, time) {
    var options = {
        method: 'GET',
        url: 'https://api.upbit.com/v1/candles/minutes/1',
        qs: {
            market: marketCode,
            to: time,
            count: 200
        }
    };

    request(options, (error, response, body) => {
        if (error) throw new Error(error);

        var result = JSON.parse(body);
        var objectName = marketCodeList[currentMarketIndex].market;
        tradeData[objectName].push(...result);

        var nextTime = new Date(result[result.length - 1].candle_date_time_utc);
        setTimeout(() => {
            if (nextTime.getTime() < compareTime.getTime()) {
                currentMarketIndex++;
                if (currentMarketIndex >= marketCodeList.length) {
                    console.log("END>>>>>>>>>>>>>>>>>>>>>>>>>>>");

                    marketCodeList.forEach(element => {
                        tradeData[element.market].reverse();
                    });

                    currentMarketIndex = 0;
                    LoadStatus();
                    return;
                }
                console.log(marketCodeList[currentMarketIndex].korean_name);
                GetCandleMinute(marketCodeList[currentMarketIndex].market, null);
            } else {
                GetCandleMinute(marketCodeList[currentMarketIndex].market, nextTime);
            }
        }, 1000);
    });
}

function coinCheck(marketCode) {
    for (var i = 0; i < tradeData[marketCode].length - 1; i++) {
        var start = isTrading(marketCode) ? getTradingInfo(marketCode).trade_price : tradeData[marketCode][i].trade_price;
        var end = tradeData[marketCode][i + 1].trade_price;
        var rate = (end - start) / start * 100;

        if (isTrading(marketCode) && (rate >= common.rate.success || rate <= common.rate.fail)) {
            // sale
            if (saleCoin(marketCode, rate)) {
                console.log('------ : ' + marketCode + ' (' + balance.toFixed(0) + ') // ' + start + ' -> ' + end + ' RATE : ' + rate.toFixed(2) + '%');
            }
        } else if (rate >= common.rate.purchase) {
            // purchase
            if (purchaseCoin(marketCode, end)) {
                console.log('++++++ : ' + marketCode + ' (' + balance.toFixed(0) + ') // ' + start + ' -> ' + end + ' RATE : ' + rate.toFixed(2) + '%');
            }
        }
    }
    currentMarketIndex++;
    if (currentMarketIndex >= marketCodeList.length) {
        currentMarketIndex = 0;
        LoadStatus();
        return;
    }
    coinCheck(marketCodeList[currentMarketIndex].market);
}

function purchaseCoin(marketCode, price) {
    if (isTrading(marketCode)) {
        return false;
    }

    if (balance - purchaseAmount < 0) {
        return false;
    }

    balance -= purchaseAmount;
    tradingList.push({
        code: marketCode,
        price: purchaseAmount,
        trade_price: price
    });

    return true;
}

function saleCoin(marketCode, rate) {
    for (var i = 0; i < tradingList.length; i++) {
        if (tradingList[i].code == marketCode) {
            var temp = purchaseAmount * (rate / 100);
            var income = purchaseAmount + temp;
            console.log('Balance : ' + balance + ' + (' + income + ')');
            balance += income;
            tradingList.splice(i, 1);
            return true;
        }
    }
    return false;
}

function isTrading(marketCode) {
    for (var i = 0; i < tradingList.length; i++) {
        if (tradingList[i].code == marketCode) {
            return true;
        }
    }
    return false;
}

function getTradingInfo(marketCode) {
    for (var i = 0; i < tradingList.length; i++) {
        if (tradingList[i].code == marketCode) {
            return tradingList[i];
        }
    }
    return 0;
}

function programEnd() {
    for (var i = 0; i < tradingList.length; i++) {
        balance += purchaseAmount;
    }

    console.log('END RESULT : ' + balance.toFixed(0));
}

function LoadTickerData(marketCode) {
    var options = {
        method: 'GET',
        url: 'https://api.upbit.com/v1/ticker',
        qs: { markets: marketCode }
    };

    request(options, function (error, response, body) {
        if (error) {
            //console.log(error);
        } else {
            var data = JSON.parse(body);
            var data = data[0];

            var tickerList = tickerData[marketCode];
            var currentTime = new Date().getTime();

            for (var i = 0; i < tickerList.length;) {
                if (tickerList[i].timestamp <= currentTime - 180000) {
                    tickerList.shift();
                    //console.log('delete // length: ' + tickerList.length);
                    continue;
                }
                i++;
            }

            if (tickerList.length == 0 || tickerList[tickerList.length - 1].current_price != data.trade_price) {
                tickerList.push({
                    current_price: data.trade_price,
                    timestamp: data.timestamp
                });
                //console.log('push // length: ' + tickerList.length);
            }

            var last_price = tickerList[0].current_price;
            var current_price = data.trade_price;

            CalculateRate(marketCode, last_price, current_price, tickerList[0].timestamp, data.timestamp);
        }

        setTimeout(() => {
            currentMarketIndex++;
            if (currentMarketIndex >= marketCodeList.length) {
                currentMarketIndex = 0;
            }
            LoadTickerData(marketCodeList[currentMarketIndex].market);
        }, 100);
    });
}

function CalculateRate(marketCode, last, current, last_timestamp, current_timestamp) {
    var start = isTrading(marketCode) ? getTradingInfo(marketCode).trade_price : last;
    var end = current;
    var rate = (end - start) / start * 100;
    var time = (current_timestamp - last_timestamp) / 1000;
    //console.log(marketCode + ': ' + last + ' => ' + current + '(' + rate.toFixed(2) + ')');

    if (isTrading(marketCode) && (rate >= common.rate.success || rate <= common.rate.fail)) {
        // sale
        if (saleCoin(marketCode, rate)) {
            if (rate > 0) {
                console.log('\x1b[32m%s\x1b[37m', '++++++ : ' + marketCode + ' (' + balance.toFixed(0) + ') // ' + start + ' -> ' + end + ' RATE : ' + rate.toFixed(2) + '%(' + time.toFixed(0) + '초)');
            } else {
                console.log('\x1b[31m%s\x1b[37m', '------ : ' + marketCode + ' (' + balance.toFixed(0) + ') // ' + start + ' -> ' + end + ' RATE : ' + rate.toFixed(2) + '%(' + time.toFixed(0) + '초)');
            }
        }
    } else if (rate >= common.rate.purchase) {
        // purchase
        if (purchaseCoin(marketCode, end)) {
            console.log('======= : ' + marketCode + ' (' + balance.toFixed(0) + ') // ' + start + ' -> ' + end + ' RATE : ' + rate.toFixed(2) + '%(' + time.toFixed(0) + '초)');
        }
    }
}

