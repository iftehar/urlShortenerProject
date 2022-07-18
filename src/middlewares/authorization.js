const jwt = require("jsonwebtoken");
const BookModel = require("../models/bookModel");
const ObjectId = require("mongoose").Types.ObjectId;

const authentication = function (req, res, next) {
  try {
    let token = req.headers["x-api-key"];
    if (!token)
      return res.status(400).send({
        status: false,
        msg: "x-api-key is required",
      });
    const decodedToken = jwt.verify(token, "project-bookManagement");
    if (!decodedToken)
      return res.status(401).send({
        status: false,
        msg: "invalid token. please enter a valid token",
      });
    req.decodedToken = decodedToken.userId;

    next();
  } catch (error) {
    res.status(500).send({
      status: false,
      msg: error.message,
    });
  }
};

const authorization = async function (req, res, next) {
  try {
    bookId = req.params.bookId;
    if (!ObjectId.isValid(bookId))
      return res
        .status(400)
        .send({ status: false, message: "Book Id is invalid in url!!!!" });
    let user = await BookModel.findById(bookId);
    if (!user)
      return res
        .status(400)
        .send({ status: false, message: "UserId is invalid in url!!!" });
    let userId = user.userId;

    if (userId != req.decodedToken) {
      return res
        .status(403
            )
        .send({
          status: false,
          message: "You are not authorized to Do this Task ...",
        });
    }

    next();
  } catch (err) {
    return res.status(500).send({ status: false, Error: err.message });
  }
};

module.exports.authentication = authentication;
module.exports.authorization = authorization;