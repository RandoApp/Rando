var logger = require("../log/logger");

module.exports =  {
    IncorrectFoodArgs: function () {
	var error = new Error("Incorrect args");
	error.foodex = {
	    status: 400,
	    code: 401,
	    message: "Incorrect args",
	    description: "You have incorrect or miss arg. See https://github.com/dimhold/foodex/wiki/Errors/#food"
	}
	return error;
    },
    UserForReportNotFound: function () {
	var error = new Error("User not found");
	error.foodex = {
	    status: 400,
	    code: 402,
	    message: "User not found",
	    description: "See https://github.com/dimhold/foodex/wiki/Errors/#report"
	}
	return error;
    },
    FoodForReportNotFound: function () {
	var error = new Error("Food not found");
	error.foodex = {
	    status: 400,
	    code: 403,
	    message: "Food not found",
	    description: "See https://github.com/dimhold/foodex/wiki/Errors/#report"
	}
	return error;
    },
    UserForBonAppetitNotFound: function () {
	var error = new Error("User not found");
	error.foodex = {
	    status: 400,
	    code: 404,
	    message: "User not found",
	    description: "See https://github.com/dimhold/foodex/wiki/Errors/#bon-appetit"
	}
	return error;
    },
    FoodForBonAppetitNotFound: function () {
	var error = new Error("Food not found");
	error.foodex = {
	    status: 400,
	    code: 405,
	    message: "Food not found",
	    description: "See https://github.com/dimhold/foodex/wiki/Errors/#bon-appetit"
	}
	return error;
    },
    LoginAndPasswordIncorrectArgs: function () {
	var error = new Error("Incorrect args");
	error.foodex = {
	    status: 400,
	    code: 406,
	    message: "Incorrect args",
	    description: "See https://github.com/dimhold/foodex/wiki/Errors/#user"
	}
	return error;
    },
    FBIncorrectArgs: function () {
	var error = new Error("Incorrect args");
	error.foodex = {
	    status: 400,
	    code: 407,
	    message: "Incorrect args",
	    description: "See https://github.com/dimhold/foodex/wiki/Errors/#user"
	}
	return error;
    },
    UserForGetNotFound: function () {
	var error = new Error("User not found");
	error.foodex = {
	    status: 400,
	    code: 408,
	    message: "User not found",
	    description: "See https://github.com/dimhold/foodex/wiki/Errors/#user"
	}
	return error;

    },
    System: function (err) {
	err.foodex = {
	    status: 500,
	    code: 501,
	    message: "Internal Server Error",
	    description: "See https://github.com/dimhold/foodex/wiki/Errors/#system"
	}
	return  err;
    },
    toResponse: function (error) {
	if (error.foodex) {
	    return error.foodex;
	}

	logger.warn("Unknown error: ", error);
	return {
	    status: 500,
	    code: 500,
	    message: "Internal Server Error",
	    description: "See https://github.com/dimhold/foodex/wiki/Errors/#system"
	};
    }
};
