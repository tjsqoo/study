var request = require("request");

var marketCodeList = [];
var currentMarketIndex = 0;
var compareTime = 0;

const CONDITION_RATE = 5;

const STATUS_INIT_DATA =            0;
const STATUS_LOAD_MARKET_DATA =     1;
const STATUS_LOAD_DATA =            2;
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
    
      
       var data = JSON.parse(body);
       data.forEach(element => {
           if (element.market.includes('KRW-')) {
            marketCodeList.push(element);
           }
       });
       LoadStatus();   
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
    var nextTime = new Date(result[result.length - 1].candle_date_time_utc);

    for (var i = 0; i < result.length - 1; i++) {
        var end = result[i].trade_price;
        var start = result[i + 1].trade_price;
        var rate = (end - start) / start * 100;
        if (rate >= CONDITION_RATE) {
            console.log(result[i].candle_date_time_utc);
        }
    }

    setTimeout(() => {
        if (nextTime.getTime() < compareTime.getTime()) {
            currentMarketIndex++;
            if (currentMarketIndex >= marketCodeList.length) {
                console.log("END>>>>>>>>>>>>>>>>>>>>>>>>>>>");     
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