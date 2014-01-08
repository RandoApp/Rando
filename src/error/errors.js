var logger = require("../log/logger");

module.exports =  {
    Unauthorized: function () {
	var error = new Error("Unauthorized");
	error.foodex = {
	    status: 401,
	    code: 400,
	    message: "Unauthorized",
	    description: "You are not authorized. See https://github.com/dimhold/foodex/wiki/Errors/#unauthorized"
	}
	return error;
    },
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
    UserForCommentNotFound: function () {
	var error = new Error("User not found");
	error.foodex = {
	    status: 400,
	    code: 402,
	    message: "User not found",
	    description: "See https://github.com/dimhold/foodex/wiki/Errors/#comment"
	}
	return error;
    },
    FoodForCommentNotFound: function () {
	var error = new Error("Food not found");
	error.foodex = {
	    status: 400,
	    code: 403,
	    message: "Food not found",
	    description: "See https://github.com/dimhold/foodex/wiki/Errors/#comment"
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
    IncorrectAnonymousId: function () {
	var error = new Error("Id is not correct");
	error.foodex = {
	    status: 400,
	    code: 409,
	    message: "Id is not correct",
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
    FacebookError: function (err) {
	err.foodex = {
	    status: 500,
	    code: 502,
	    message: "Facebook Server Error",
	    description: "See https://github.com/dimhold/foodex/wiki/Errors/#facebook"
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
