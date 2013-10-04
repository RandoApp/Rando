var account = require("../model/accountModel");

module.exports = {
    report: function (userEmail, foodId, callback) {
	account.getByEmail(userEmail, function (err, account) {
	    if (err) {
		logger.warn(err);
		callback(err);
		return;
	    }
	    if (!account) {
		callback(new Error());
		return;
	    }
		
	    account.foods.forEach(function (food) {
		if (item.partner) {
		    if (food.partner.id == foodId) {
			food.partner.report = true;
			account.update(account);
			return false;
		    }
		}
	    });
	    callback();
	});
    },
    bonAppetit: function (id) {
    },
};
