var logger = require("../log/logger");

module.exports =  {
    Unauthorized: function () {
	var error = new Error("Unauthorized");
	error.rando = {
	    status: 401,
	    code: 400,
	    message: "Unauthorized",
	    description: "You are not authorized. See https://github.com/RandoApp/Rando/wiki/Errors"
	}
	return error;
    },
    IncorrectArgs: function () {
	var error = new Error("Incorrect args");
	error.rando = {
	    status: 400,
	    code: 401,
	    message: "Incorrect args",
	    description: "You have incorrect or miss arg. See https://github.com/RandoApp/Rando/wiki/Errors"
	}
	return error;
    },
    UserForCommentNotFound: function () {
	var error = new Error("User not found");
	error.rando = {
	    status: 400,
	    code: 402,
	    message: "User not found",
	    description: "See https://github.com/RandoApp/Rando/wiki/Errors"
	}
	return error;
    },
    RandoForCommentNotFound: function () {
	var error = new Error("Rando not found");
	error.rando = {
	    status: 400,
	    code: 403,
	    message: "Rando not found",
	    description: "See https://github.com/RandoApp/Rando/wiki/Errors"
	}
	return error;
    },
    LoginAndPasswordIncorrectArgs: function () {
	var error = new Error("Incorrect args");
	error.rando = {
	    status: 400,
	    code: 406,
	    message: "Incorrect args",
	    description: "See https://github.com/RandoApp/Rando/wiki/Errors"
	}
	return error;
    },
    FBIncorrectArgs: function () {
	var error = new Error("Incorrect args");
	error.rando = {
	    status: 400,
	    code: 407,
	    message: "Incorrect args",
	    description: "See https://github.com/RandoApp/Rando/wiki/Errors"
	}
	return error;
    },
    UserForGetNotFound: function () {
	var error = new Error("User not found");
	error.rando = {
	    status: 400,
	    code: 408,
	    message: "User not found",
	    description: "See https://github.com/RandoApp/Rando/wiki/Errors"
	}
	return error;
    },
    IncorrectAnonymousId: function () {
	var error = new Error("Id is not correct");
	error.rando = {
	    status: 400,
	    code: 409,
	    message: "Id is not correct",
	    description: "See https://github.com/RandoApp/Rando/wiki/Errors"
	}
	return error;
    },
    GoogleIncorrectArgs: function () {
	var error = new Error("Incorrect args");
	error.rando = {
	    status: 400,
	    code: 410,
	    message: "Incorrect args",
	    description: "See https://github.com/RandoApp/Rando/wiki/Errors"
	}
	return error;
    },
    Forbidden: function (resetTime) {
	var error = new Error("Forbidden");
	error.rando = {
	    status: 403,
	    code: 411,
	    message: "Forbidden. Reset: " + resetTime,
	    description: "See https://github.com/RandoApp/Rando/wiki/Errors"
	}
	return error;
    },
    System: function (err) {
	err.rando = {
	    status: 500,
	    code: 501,
	    message: "Internal Server Error",
	    description: "See https://github.com/RandoApp/Rando/wiki/Errors"
	}
	return  err;
    },
    FacebookError: function (err) {
	err.rando = {
	    status: 500,
	    code: 502,
	    message: "Facebook Server Error",
	    description: "See https://github.com/RandoApp/Rando/wiki/Errors"
	}
	return  err;
    },
    GoogleError: function (err) {
	err.rando = {
	    status: 500,
	    code: 503,
	    message: "Google Server Error",
	    description: "See https://github.com/RandoApp/Rando/wiki/Errors"
	}
	return  err;
    },
    toResponse: function (error) {
	if (error.rando) {
	    return error.rando;
	}

	logger.warn("Unknown error: ", error);
	return {
	    status: 500,
	    code: 500,
	    message: "Internal Server Error",
	    description: "See https://github.com/RandoApp/Rando/wiki/Errors"
	};
    }
};
