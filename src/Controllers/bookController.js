const BookModel = require("../models/bookModel");
const mongoose = require("mongoose");
const reviewsModel = require("../models/reviewsModel");
const userModel = require("../models/userModel");
const ObjectId = require("mongoose").Types.ObjectId;
const awsController = require("../controllers/awsController")

let validateISBN = /(?=(?:\D*\d){13}(?:(?:\D*\d){3})?$)/;
let validateDate = /^\d{4}\-(0?[1-9]|1[012])\-(0?[1-9]|[12][0-9]|3[01])$/;
const validateField = /^[a-zA-Z0-9\s\-,?_.]+$/;
const validCategory = /^[a-zA-Z]+/;
const validTitle = /^[a-zA-Z]+/;

const isValidExcerpt = function (value) {
  if (typeof value == "undefined" || typeof value == null) return false;
  if (typeof value === "string" && value.trim().length === 0) return false;
  return true;
};
//function to check if tag and sub-catogery string is valid or not ?
function check(t) {
  ///  "motivation"  ["motivation"]
  let regEx = /^[a-zA-Z]+$/;

  if (t) {
    if (!Array.isArray(t)) {
      t = t.toString().split(" "); //moticvetion
      //t=["motivation"]
    }
    for (i of t) {
      if (!regEx.test(i)) {
        return true;
      }
    }
  }
}
/*--------CREATE BOOK---------------*/

const createBook = async (req, res) => {
  try {
    const data = req.body;
    let files = req.files;
    if (files && files.length > 0)
      var uploadedFileURL = await awsController.uploadFile(files[0]);
    const {title,excerpt,bookCover,userId,ISBN,category,subcategory,reviews,isDeleted,releasedAt,...rest} = data;

    data.bookCover = uploadedFileURL;
    data = JSON.parse(JSON.stringify(data));
    console.log(data);

    //check for empty body
    if (Object.keys(data).length == 0)
      return res
        .status(400)
        .send({ status: false, message: "please enter some DETAILS!!!" });
    if (Object.keys(rest).length > 0)
      return res
        .status(400)
        .send({ status: false, message: "Invalid attributes in request Body" });
    if (!title)
      return res
        .status(400)
        .send({ status: false, message: "TITLE is required!!!" });
    if (!excerpt)
      return res
        .status(400)
        .send({ status: false, message: "EXCERPT is required!!!" });
    if (!userId)
      return res
        .status(400)
        .send({ status: false, message: "UserID is required!!!" });
    if (!ISBN)
      return res
        .status(400)
        .send({ status: false, message: "ISBN is required!!!" });
    if (!category)
      return res
        .status(400)
        .send({ status: false, message: "CATEGORY is required!!!" });
    if (!subcategory)
      return res
        .status(400)
        .send({ status: false, message: "SUBCATEGORY is type is invalid!!!" });
    if (!releasedAt)
      return res
        .status(400)
        .send({ status: false, message: "RELEASED DATE is required!!!" });
    if (isDeleted)
      return res.status(400).send({
        status: false,
        message: " CAN'T DELETED BOOK , AT TIME OF CREATION!!!",
      });
    if (req.decodedToken !== userId)
      return res.status(403).send({
        status: false,
        message: "You are UnAuthorized to do the task",
      });

    if (reviews) {
      if (reviews !== 0)
        //creat ke time review 0 hona chahiye// not equal to zero hota hai to
        return res.status(400).send({
          status: false,
          message: "You Can't implement reviews at time of Creation",
        });
    }

    if (!validTitle.test(title))
      return res
        .status(400)
        .send({ status: false, message: "format of title is wrong!!!" });
    if (!ObjectId.isValid(userId))
      return res.status(400).send({ status: false, msg: "UserId is Invalid" });

    if (!validateISBN.test(ISBN))
      return res
        .status(400)
        .send({ status: false, message: "enter valid ISBN number" });
    if (!validCategory.test(category))
      return res
        .status(400)
        .send({ status: false, message: "plz enter valid Category" });
    if (!validateDate.test(releasedAt))
      return res.status(400).send({
        status: false,
        message: "date must be in format  YYYY-MM-DD!!!",
      });
    if (!isValidExcerpt(excerpt))
      return res
        .status(400)
        .send({ status: false, message: "invalid excerpt details" });

    // in this blog of code we are checking that subcategory should be valid, u can't use empty space as subcategory
    if (check(subcategory))
      return res
        .status(400)
        .send({ status: false, msg: "subcategory text is invalid" });

    let findTitle = await BookModel.findOne({ title: title });
    if (findTitle) {
      return res
        .status(400)
        .send({ status: false, message: "title already exist" });
    }

    let findUserID = await userModel.findById(userId);
    if (!findUserID)
      return res.status(400).send({
        status: false,
        message: "User Not Present in DB as per UserID",
      });

    let findUserISBN = await BookModel.findOne({ ISBN: ISBN });
    if (findUserISBN)
      return res
        .status(400)
        .send({ status: false, message: "ISBN already exist" });

    const book = await BookModel.create(data);
    return res
      .status(201)
      .send({ status: true, message: "success", data: book });
  } catch (err) {
    return res.status(500).send({ status: false, Error: err.message });
  }
};

/*--------GET ALL BOOK QUERY---------------*/
const getAllBooks = async (req, res) => {
  try {
    let data = req.query;
    let { userId, category, subcategory, ...rest } = req.query; //destractureing

    if (Object.keys(rest).length > 0) {
      return res
        .status(400)
        .send({ status: false, message: "please enter valid key !!!" });
    }

    // if (Object.keys(data).length == 0) {
    //   return res
    //     .status(400)
    //     .send({ status: false, message: "please enter some DETAILS!!!" });
    // }
    if (userId && !ObjectId.isValid(userId)) {
      return res.status(400).send({ status: false, msg: "UserId is Invalid" });
    }

    data.isDeleted = false;

    const allBooks = await BookModel.find(data)
      .select({
        _id: 1,
        title: 1,
        excerpt: 1,
        userId: 1,
        category: 1,
        releasedAt: 1,
        reviews: 1,
      })
      .sort({ title: 1 });

    if (allBooks.length == 0) {
      return res.status(404).send({
        status: false,
        message: "Book list not found",
      });
    }

    res.status(200).send({
      status: true,
      message: "Books list",
      data: allBooks,
    });
  } catch (err) {
    res.status(500).send({
      status: false,
      message: err.message,
    });
  }
};
/*--------GET BOOK BY ID---------------*/
const getBooksById = async function (req, res) {
  try {
    let bookId = req.params.bookId;
    if (!bookId) {
      return res
        .status(400)
        .send({ status: false, message: "Please give book id" });
    }
    let isValidbookID = mongoose.isValidObjectId(bookId);
    if (!isValidbookID) {
      return res
        .status(400)
        .send({ status: false, message: "Book Id is Not Valid" });
    }

    const findbook = await BookModel.findOne({
      _id: bookId,
      isDeleted: false,
    })
      .select({ __v: 0, ISBN: 0 })
      .lean();
    if (!findbook)
      return res
        .status(404)
        .send({ status: false, message: "BookId do not exist" });
    const reviewsdata = await reviewsModel
      .find({
        bookId: bookId,
        isDeleted: false,
      })
      .select({ __v: 0, isDeleted: 0, createdAt: 0, updatedAt: 0 });
    if (!reviewsdata)
      return res
        .status(404)
        .send({ status: false, message: "No Reviews Found As per BookID" });
    findbook.reviewsData = reviewsdata;

    return res
      .status(200)
      .send({ status: true, message: "Book Lists", data: findbook });
  } catch (err) {
    return res.status(500).send({ status: false, message: err.message });
  }
};
/*--------UPDATE BOOK BY ID---------------*/
const updateBook = async (req, res) => {
  try {
    let bookId = req.params.bookId;
    if (!bookId) {
      return res
        .status(400)
        .send({ status: false, message: "Please give book id" });
    }
    let { title, excerpt, releasedAt, ISBN, ...rest } = req.body; //destractureing
    if (Object.keys(rest).length > 0) {
      return res
        .status(400)
        .send({ status: false, message: "please enter valid key !!!" });
    }
    if (Object.keys(req.body).length == 0) {
      return res
        .status(400)
        .send({ status: false, message: "please enter some DETAILS!!!" });
    }
    let isValidbookID = mongoose.isValidObjectId(bookId); //check if objectId is objectid
    if (!isValidbookID) {
      return res
        .status(400)
        .send({ status: false, message: "Book Id is Not Valid" });
    }

    const findbookId = await BookModel.findOne({
      _id: bookId,
      isDeleted: false,
    });
    if (!findbookId)
      return res
        .status(404)
        .send({ status: false, message: "BookId dont exist" });

    if (req.body.hasOwnProperty("title")) {
      if (!validateField.test(title))
        return res
          .status(400)
          .send({ status: false, message: "format of title is wrong!!!" });
      let findTitle = await BookModel.findOne({ title: title });
      if (findTitle)
        return res
          .status(400)
          .send({ status: false, message: "title already exist" });
    }

    if (req.body.hasOwnProperty("ISBN")) {
      if (!validateISBN.test(ISBN))
        return res
          .status(400)
          .send({ status: false, message: "enter valid ISBN number" });
      let findISBN = await BookModel.findOne({ ISBN: ISBN });
      if (findISBN)
        return res
          .status(400)
          .send({ status: false, message: "ISBN already exist" });
    }
    if (req.body.hasOwnProperty("releasedAt")) {
      if (!validateDate.test(releasedAt))
        return res.status(400).send({
          status: false,
          message: "date must be in format  YYYY-MM-DD!!!",
        });
    }
    if (req.body.hasOwnProperty("excerpt")) {
      if (!isValidExcerpt(excerpt))
        return res
          .status(400)
          .send({ status: false, message: "invalid excerpt details" });
    }

    let updatedBook = await BookModel.findByIdAndUpdate(bookId, req.body, {
      new: true,
    });
    return res.status(200).send({ status: true, data: updatedBook });
  } catch (err) {
    return res.status(500).send({ status: false, message: err.message });
  }
};
/*--------DELETE BOOK BY ID---------------*/
const deleteBookById = async (req, res) => {
  let bookId = req.params.bookId;
  if (!bookId) {
    return res
      .status(400)
      .send({ status: false, message: "Please give book id" });
  }
  let isValidbookID = mongoose.Type.ObjectId.isValid(bookId);
  if (!isValidbookID) {
    return res
      .status(400)
      .send({ status: false, message: "Book Id is Not Valid" });
  }

  let deleteBookData = await BookModel.findOneAndUpdate(
    { _id: bookId, isDeleted: false },
    { isDeleted: true, deletedAt: new Date() },
    { new: true }
  );
  if (!deleteBookData) {
    return res
      .status(404)
      .send({ status: false, message: "No Books Found As per BookID" });
  }
  return res.status(200).send({
    status: true,
    message: "Deleted Books list",
    data: deleteBookData,
  });
};
module.exports.createBook = createBook;
module.exports.getAllBooks = getAllBooks;
module.exports.getBooksById = getBooksById;
module.exports.updateBook = updateBook;
module.exports.deleteBookById = deleteBookById;
