const express = require("express");

const router = express.Router();
const {createUrl,getUrl}=require("../Controllers/urlController")

router.post("/url/shorten",createUrl)
router.get("/:urlCode", getUrl)



router.all("/**", function (req, res) {
  res.status(404).send({
    status: false,
    msg: "The api you request is not available",
  });
});

module.exports = router;
