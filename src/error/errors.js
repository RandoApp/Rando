var logger = require("../log/logger");

module.exports =  {
    IncorrectFoodArgs: function () {
	var error = new Error("Incorrect args");
	error.foodex = {
	    code: 400,
	    message: "",
	    description: ""
	}
	return error;
    },
    UserForReportNotFound: function () {
	var error = new Error("User not found");
	error.foodex = {
	    code: 400,
	    message: "",
	    description: ""
	}
	return error;
    },
    FoodForReportNotFound: function () {
	var error = new Error("Food not found");
	error.foodex = {
	    code: 400,
	    message: "",
	    description: ""
	}
	return error;
    },
    UserForBonAppetitNotFound: function () {
	var error = new Error("User not found");
	error.foodex = {
	    code: 400,
	    message: "",
	    description: ""
	}
	return error;
    },
    FoodForBonAppetitNotFound: function () {
	var error = new Error("Food not found");
	error.foodex = {
	    code: 400,
	    message: "",
	    description: ""
	}
	return error;
    },
    LoginAndPasswordIncorrectArgs: function () {
	var error = new Error("Incorrect args");
	error.foodex = {
	    code: 400,
	    message: "",
	    description: ""
	}
	return error;
    },
    FBIncorrectArgs: function () {
	var error = new Error("Incorrect args");
	error.foodex = {
	    code: 400,
	    message: "",
	    description: ""
	}
	return error;
    },
    System: function (err) {
	err.foodex = {
	    code: 500,
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
	    code: 500,
	    message: "",
	    description: "" 
	};
    }
};
