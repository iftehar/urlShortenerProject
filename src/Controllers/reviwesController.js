const reviewModel = require("../models/reviewsModel");
const bookModel = require("../models/bookModel");
const ObjectId = require("mongoose").Types.ObjectId;

const isValid = function (value) {
  if (typeof value == null) return false; //Here it Checks that Is there value is null or undefined  " "
  if (typeof value === "string" && value.trim().length === 0) return false; // Here it Checks that Value contain only Space
  return true;
};
let alphaRegex = /^[A-Za-z -.]+$/;

const createReview = async (req, res) => {
  try {
    let { bookId } = req.params;
    let { reviewedBy, reviewedAt, rating, review, ...rest } = req.body;

    if (Object.keys(req.body).length == 0)
      return res
        .status(400)
        .send({ status: false, message: "Body Can't be Empty " });
    if (Object.keys(rest).length > 0)
      return res
        .status(400)
        .send({ status: false, message: "Invalid attributes in request Body" });

    if (!ObjectId.isValid(bookId))
      return res
        .status(400)
        .send({ status: false, message: "Book Id is Invalid !!!!" });

    if (!rating)
      return res
        .status(400)
        .send({ status: false, message: "rating is Missing" });

    let findBook = await bookModel.findOne({ _id: bookId, isDeleted: false });
    if (!findBook)
      return res.status(404).send({
        status: false,
        message: "No such Book is Present as Per BookID",
      });

    if (!isValid(reviewedBy))
      return res
        .status(400)
        .send({ status: false, message: " Plz enter Valid reviewedBY" });
    if (!alphaRegex.test(reviewedBy))
      return res.status(400).send({
        status: false,
        message: "oops! reviewedBY can not be a number",
      });

    if (!(rating >= 1 && rating <= 5))
      return res
        .status(400)
        .send({ status: false, message: " Plz enter Rating between [1-5]" });

    req.body.bookId = bookId.toString();
    req.body.reviewedAt = new Date();
    let reviewDate = await reviewModel.create(req.body);
    let updatedBook = await bookModel
      .findByIdAndUpdate(bookId, { $inc: { reviews: 1 } }, { new: true })
      .lean();
    updatedBook.reviewDate = reviewDate;
    return res
      .status(201)
      .send({ status: true, message: "Success", data: updatedBook });
  } catch (err) {
    return res.status(500).send({ status: false, message: err.message });
  }
};

const deleteReview = async (req, res) => {
  try {
    let reviewId = req.params.reviewId;
    let bookId = req.params.bookId;

    if (!ObjectId.isValid(reviewId))
      return res
        .status(400)
        .send({ status: false, message: "Review Id is Invalid !!!!" });
    if (!ObjectId.isValid(bookId))
      return res
        .status(400)
        .send({ status: false, message: "Book Id is Invalid !!!!" });

    const findReview = await reviewModel.findOne({
      _id: reviewId,
      isDeleted: false,
    }); //check id exist in review model
    if (!findReview)
      return res.status(404).send({
        status: false,
        message: "Review not exist as per review Id in URL",
      });

    //bookId exist in our database
    const findBook = await bookModel.findOne({ _id: bookId, isDeleted: false }); //check id exist in book model
    if (!findBook)
      return res.status(404).send({
        status: false,
        message: "Book Not Exist as per bookId in url",
      });

    const deleteReview = await reviewModel.findOneAndUpdate(
      { _id: reviewId, bookId: bookId, isDeleted: false },
      { isDeleted: true },
      { new: true }
    );
    if (!deleteReview)
      return res.status(404).send({
        status: false,
        message: "This Review is Not Belongs to This Book!!!",
      });

    await bookModel.findByIdAndUpdate(bookId, { $inc: { reviews: -1 } });
    return res.status(200).send({
      status: true,
      message: "Successfully deleted review",
      data: deleteReview,
    });
  } catch (err) {
    return res.status(500).send({ status: false, message: err.message });
  }
};

const updateReview = async (req, res) => {
  try {
    let bookId = req.params.bookId;
    let reviewId = req.params.reviewId;

    let { review, rating, reviewedBy, ...rest } = req.body;

    if (Object.keys(req.body).length == 0)
      return res
        .status(400)
        .send({ status: false, message: "Body Can't be Empty " });
    if (Object.keys(rest).length > 0)
      return res
        .status(400)
        .send({ status: false, message: "Invalid attributes in request Body" });

    if (!ObjectId.isValid(reviewId))
      return res
        .status(400)
        .send({ status: false, message: "Review Id is Invalid !!!!" });
    if (!ObjectId.isValid(bookId))
      return res
        .status(400)
        .send({ status: false, message: "Book Id is Invalid !!!!" });

    const findReview = await reviewModel.findOne({
      _id: reviewId,
      isDeleted: false,
    }); //check id exist in review model
    if (!findReview)
      return res.status(404).send({
        status: false,
        message: "Review not exist as per review Id in URL",
      });

    //bookId exist in our database
    const findBook = await bookModel.findOne({ _id: bookId, isDeleted: false }); //check id exist in book model
    if (!findBook)
      return res.status(404).send({
        status: false,
        message: "Book not exist as per Book Id in URL",
      });

    const updateReview = await reviewModel.findOneAndUpdate(
      { _id: reviewId, bookId: bookId, isDeleted: false },
      req.body,
      { new: true }
    );
    if (!updateReview)
      return res.status(404).send({
        status: false,
        message: "This Review is Not Belongs to This Book!!!",
      });
    return res.status(200).send({
      status: true,
      message: "Successfully Update review",
      data: updateReview,
    });
  } catch (err) {
    return res.status(500).send({ status: false, message: err.message });
  }
};

module.exports.createReview = createReview;
module.exports.updateReview = updateReview;
module.exports.deleteReview = deleteReview;