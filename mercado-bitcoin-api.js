var unirest = require('unirest');
var crypto = require('crypto');
var moment = require('moment');
var _ = require('lodash');

require('./functions.js')();

var BASE_URL = 'https://www.mercadobitcoin.net',
    DATA_API_PATH = '/api/',
    TRADE_API_PATH = '/tapi/v3/',
    ENDPOINT_DATA_API = BASE_URL + DATA_API_PATH,
    ENDPOINT_TRADE_API = BASE_URL + TRADE_API_PATH;


var MercadoBitcoin = function (config) {
    this.key = config.key;
    this.secret = config.secret;
    this.pin = config.pin;
};

MercadoBitcoin.prototype._acceptedCurrencies = [
    "BRL", "BTC", "BHC", "BTC", "LTC"
];

MercadoBitcoin.prototype._acceptedTradePairs = [
    "BRLBTC", "BRLBHC", "BRLLTC"
];

MercadoBitcoin.prototype._get = function (currency, method, callback) {
    if(!_.includes(this._acceptedCurrencies, currency))
        return callback("Invalid Currency");

    unirest.get(ENDPOINT_DATA_API + "/" + currency + "/"+ method)
        .headers('Accept', 'application/json')
        .end(function (response) {
            var data = JSON.parse(response.raw_body);
            callback(data.error_message, data);
        });
};

MercadoBitcoin.prototype._post = function (method, parameters, callback) {
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
            var data = JSON.parse(response.raw_body);

            callback(data.error_message, data);
        });
};

MercadoBitcoin.prototype.ticker = function (currency, callback) {
    return this._get(currency, "ticker", callback);
};

MercadoBitcoin.prototype.orderbook = function (currency, callback) {
    return this._get(currency, "orderbook", callback);
};

MercadoBitcoin.prototype.trades = function (currency, callback) {
    return this._get(currency, "trades", callback);
};

MercadoBitcoin.prototype.day_summary = function (currency, date, callback) {
    return this._get(currency, "day-summary/"+moment(date).format("YYYY/MM/DD"), callback);
};

// --------------------------------------

MercadoBitcoin.prototype.list_system_messages = function (params, callback) {
    return this._post("list_system_messages", params, callback)
};

MercadoBitcoin.prototype.get_account_info = function (callback) {
    return this._post("get_account_info", null, callback)
};

MercadoBitcoin.prototype.get_order = function (params, callback) {
    return this._post("get_order", params, callback)
};

MercadoBitcoin.prototype.list_orders = function (params, callback) {
    return this._post("list_orders", params, callback)
};

MercadoBitcoin.prototype.list_orderbook = function (params, callback) {
    return this._post("list_orderbook", params, callback)
};

MercadoBitcoin.prototype.place_buy_order = function (params, callback) {
    return this._post("place_buy_order", params, callback)
};

MercadoBitcoin.prototype.place_sell_order = function (params, callback) {
    return this._post("place_sell_order", params, callback)
};

MercadoBitcoin.prototype.cancel_order = function (params, callback) {
    return this._post("cancel_order", params, callback)
};

MercadoBitcoin.prototype.get_withdrawal = function (params, callback) {
    return this._post("get_withdrawal", params, callback)
};

MercadoBitcoin.prototype.withdraw_coin = function (params, callback) {
    return this._post("withdraw_coin", params, callback)
};


module.exports = MercadoBitcoin;