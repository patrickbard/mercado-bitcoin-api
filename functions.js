var qs = require('querystring');

module.exports = function () {
    this.getUrlParams = function(method, parameters) {
        var now = Math.round(new Date().getTime() / 1000);
        var params = (parameters) ? parameters : {};

        params.tapi_method = method;
        params.tapi_nonce = now;

        return qs.stringify(params);
    }
};