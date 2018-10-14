var request = require("request");

var marketCodeList = [];
var tradeData = {};
var tradingList = [];

var currentMarketIndex = 0;
var compareTime = 0;

var balance = 1000000;
var purchaseAmount = 10000;

const RATE_PURCHASE         = 3;
const RATE_SALE_SUCCESS     = 1;
const RATE_SALE_FAIL        = -1;

const STATUS_INIT_DATA =            0;
const STATUS_LOAD_MARKET_DATA =     1;
const STATUS_LOAD_DATA =            2;
const STATUS_PURCHASE_CHECK =       3;
const STATUS_END =                  4;
var CURRENT_STATUS = STATUS_INIT_DATA;

LoadStatus();
function LoadStatus() {
    switch(CURRENT_STATUS++) {
        case STATUS_INIT_DATA: {
            InitData();
        }
        break;
        case STATUS_LOAD_MARKET_DATA: {
            GetMarketCode();
        }
        break;
        case STATUS_LOAD_DATA: {
            console.log(marketCodeList[currentMarketIndex].korean_name);
            GetCandleMinute(marketCodeList[currentMarketIndex].market, null);
        }
        break;
        case STATUS_PURCHASE_CHECK: {
            coinCheck(marketCodeList[currentMarketIndex].market);
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

function GetMarketCode() {
    var options = { 
        method: 'GET',
        url: 'https://api.upbit.com/v1/market/all' 
    };
    
    request(options, (error, response, body) => {
        if (error) throw new Error(error);
    
        var count = 0;
        var data = JSON.parse(body);
        for (var i = 0; i < data.length; i++) {
            if (data[i].market.includes('KRW-')) {
                marketCodeList.push(data[i]);
                tradeData[data[i].market] = [];
                // count++;
                // if (count >= 5) {
                //     break;
                // }
            }
        }
        LoadStatus();   
    });
}

var tempObject;
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

        if (isTrading(marketCode) && (rate >= RATE_SALE_SUCCESS || rate <= RATE_SALE_FAIL)) {
            // sale
            if (saleCoin(marketCode, rate)) {
                console.log('------ : ' + marketCode + ' (' + balance.toFixed(0) + ') // ' + start + ' -> ' + end + ' RATE : ' + rate.toFixed(2) + '%');
            }
        } else if (rate >= RATE_PURCHASE) {
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