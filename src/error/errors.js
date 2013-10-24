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
	    message: "",
	    description: ""
	}
	return error;
    },
    UserForBonAppetitNotFound: function () {
	var error = new Error("User not found");
	error.foodex = {
	    status: 400,
	    code: 404,
	    message: "",
	    description: ""
	}
	return error;
    },
    FoodForBonAppetitNotFound: function () {
	var error = new Error("Food not found");
	error.foodex = {
	    status: 400,
	    code: 405,
	    message: "",
	    description: ""
	}
	return error;
    },
    LoginAndPasswordIncorrectArgs: function () {
	var error = new Error("Incorrect args");
	error.foodex = {
	    status: 400,
	    code: 406,
	    message: "",
	    description: ""
	}
	return error;
    },
    FBIncorrectArgs: function () {
	var error = new Error("Incorrect args");
	error.foodex = {
	    status: 400,
	    code: 407,
	    message: "",
	    description: ""
	}
	return error;
    },
    System: function (err) {
	err.foodex = {
	    status: 500,
	    code: 501,
	    message: "",
	    description: ""
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
	    message: "",
	    description: ""
	};
    }
};
