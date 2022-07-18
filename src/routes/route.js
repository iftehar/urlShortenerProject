const express = require("express");

const router = express.Router();
const Usercontroller = require("../Controllers/userController");
const Bookcontroller = require("../Controllers/bookController");
const Reviewcontroller = require("../Controllers/reviwesController");
const {authentication,authorization} = require("../middlewares/authorization");
const awsController=require("../Controllers/awsController")

//router.post("/write-file-aws",awsController.createUrl)
//router.post("/write-file-aws",awsController.uploadFile)

//USER API
router.post("/register", Usercontroller.createUser);
router.post("/login", Usercontroller.loginUser);
//BOOK API
router.post("/books",authentication, Bookcontroller.createBook);
router.get("/books", authentication, Bookcontroller.getAllBooks);
router.get("/books/:bookId", authentication,Bookcontroller.getBooksById);
router.put("/books/:bookId", authentication,authorization, Bookcontroller.updateBook);
router.delete("/books/:bookId",authentication,authorization,Bookcontroller.deleteBookById);
//REVIEW API
router.post("/books/:bookId/review", Reviewcontroller.createReview);
router.put("/books/:bookId/review/:reviewId", Reviewcontroller.updateReview);
router.delete("/books/:bookId/review/:reviewId", Reviewcontroller.deleteReview);

router.all("/**", function (req, res) {
  res.status(404).send({
    status: false,
    msg: "The api you request is not available",
  });
});

module.exports = router;
