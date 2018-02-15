var unirest = require('unirest');
var crypto = require('crypto');
var moment = require('moment');
var _ = require('lodash');

require('./functions.js')();

var BASE_URL = 'https://www.mercadobitcoin.net',
    DATA_API_PATH = '/api',
    TRADE_API_PATH = '/tapi/v3/',
    ENDPOINT_DATA_API = BASE_URL + DATA_API_PATH,
    ENDPOINT_TRADE_API = BASE_URL + TRADE_API_PATH;

var RECOVERABLE_HTTP_STATUS = [503, 504, 509, 598, 599];

var API_STATUS = {
    SUCCESS: 100,
    API_DEACTIVATED: 199,
    TOO_MANY_REQUESTS: 429,
    REQUEST_DENIED: 430,
    REQUESTS_TEMPORARILY_BLOCKED: 431
};

var RECOVERABLE_API_STATUS = [
    API_STATUS.API_DEACTIVATED,
    API_STATUS.TOO_MANY_REQUESTS,
    API_STATUS.REQUEST_DENIED,
    API_STATUS.REQUESTS_TEMPORARILY_BLOCKED
];

var MercadoBitcoin = function (config) {
    this.key = config.key;
    this.secret = config.secret;
    this.pin = config.pin;
};

MercadoBitcoin.prototype._acceptedCurrencies = [
    "BRL", "BTC", "BHC", "LTC"
];

MercadoBitcoin.prototype._acceptedTradePairs = [
    "BRLBTC", "BRLBHC", "BRLLTC"
];

var httpError = function(response) {
    return {
        recoverable: _.includes(RECOVERABLE_HTTP_STATUS, response.status),
        message: response.raw_body
    };
};

var apiError = function(data) {
    return {
        recoverable: _.includes(RECOVERABLE_API_STATUS, data.status_code),
        message: data.error_message
    };
};

MercadoBitcoin.prototype._getData = function (currency, method, urlSuffix, params, onSuccess, onError) {
    if(!_.includes(this._acceptedCurrencies, currency))
        return onError("Invalid Currency");

    var url = `${ENDPOINT_DATA_API}/${currency}/${method}/` + _.join(urlSuffix, "/");

    unirest.get(url)
        .headers('Accept', 'application/json')
        .qs(params)
        .end(function (response) {
            if (response.ok) {
                onSuccess(response.body);
            } else {
                onError(httpError(response));
            }
        });
};

MercadoBitcoin.prototype._postTrade = function (method, parameters, onSuccess, onError) {
    if(!this.key)
        return callback('Must provide key to make this API request.');

    var url_params = getUrlParams(method, parameters);

    var signature = crypto.createHmac('sha512', this.secret)
        .update(TRADE_API_PATH + '?' + url_params)
        .digest('hex');

    unirest.post(ENDPOINT_TRADE_API)
        .headers({'TAPI-ID': this.key})
        .headers({'TAPI-MAC': signature})
        .send(url_params)
        .end(function (response) {
            if (response.ok) {
                var data = JSON.parse(response.raw_body);
                if (data.status_code == STATUS.SUCCESS) {
                    onSuccess(data);
                } else {
                    onError(apiError(data));
                }
            } else {
                onError(httpError(response));
            }
        });
};

MercadoBitcoin.prototype.ticker = function (currency, onSuccess, onError) {
    return this._getData(currency, "ticker", [], {}, onSuccess, onError);
};

MercadoBitcoin.prototype.orderbook = function (currency, onSuccess, onError) {
    return this._getData(currency, "orderbook", [], {}, onSuccess, onError);
};

MercadoBitcoin.prototype.trades = function (currency, params, onSuccess, onError) {
    var urlSuffix = [];
    if (params.from) {
        urlSuffix.push(params.from);
    } if (params.to) {
        urlSuffix.push(params.to);
    }
    return this._getData(currency, "trades", urlSuffix,
        _.omit(params, ["from", "to"]), onSuccess, onError);
};

MercadoBitcoin.prototype.day_summary = function (currency, date, onSuccess, onError) {
    return this._getData(currency, [], {}, "day-summary/"+moment(date).format("YYYY/MM/DD"), onSuccess, onError);
};

// --------------------------------------

MercadoBitcoin.prototype.list_system_messages = function (params, onSuccess, onError) {
    return this._postTrade("list_system_messages", params, onSuccess, onError)
};

MercadoBitcoin.prototype.get_account_info = function (callback) {
    return this._postTrade("get_account_info", null, onSuccess, onError)
};

MercadoBitcoin.prototype.get_order = function (params, onSuccess, onError) {
    return this._postTrade("get_order", params, onSuccess, onError)
};

MercadoBitcoin.prototype.list_orders = function (params, onSuccess, onError) {
    return this._postTrade("list_orders", params, onSuccess, onError)
};

MercadoBitcoin.prototype.list_orderbook = function (params, onSuccess, onError) {
    return this._postTrade("list_orderbook", params, onSuccess, onError)
};

MercadoBitcoin.prototype.place_buy_order = function (params, onSuccess, onError) {
    return this._postTrade("place_buy_order", params, onSuccess, onError)
};

MercadoBitcoin.prototype.place_sell_order = function (params, onSuccess, onError) {
    return this._postTrade("place_sell_order", params, onSuccess, onError)
};

MercadoBitcoin.prototype.cancel_order = function (params, onSuccess, onError) {
    return this._postTrade("cancel_order", params, onSuccess, onError)
};

MercadoBitcoin.prototype.get_withdrawal = function (params, onSuccess, onError) {
    return this._postTrade("get_withdrawal", params, onSuccess, onError)
};

MercadoBitcoin.prototype.withdraw_coin = function (params, onSuccess, onError) {
    return this._postTrade("withdraw_coin", params, onSuccess, onError)
};

module.exports = MercadoBitcoin;