const emailValidator = require("email-validator");
const userModel = require("../models/userModel");
const jwt = require("jsonwebtoken");
const validName = /^[A-Za-z -.]+$/;
const validPhoneNumber = /^[0]?[6789]\d{9}$/;
let validPassword = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*\W)/;

const isValid = function (value) {
  if (typeof value == "undefined" || typeof value == null) return false;
  if (typeof value === "string" && value.trim().length === 0) return false;
  return true;
};

/*--------CREATE USER ---------------*/
const createUser = async function (req, res) {
  let data = req.body;

  const { title, name, phone, email, password, address, ...rest } = data; //destactureing
  if (Object.keys(rest).length > 0) {
    return res
      .status(400)
      .send({ status: false, message: "please enter valid key !!!" });
  }

  if (Object.keys(data).length == 0) {
    return res
      .status(400)
      .send({ status: false, message: "Require-Body Mandatory" });
  }

  if (!title) {
    return res
      .status(400)
      .send({ status: false, message: "title is  Mandatory" });
  }
  if (!["Mr", "Mrs", "Miss"].includes(title)) {
    return res
      .status(400)
      .send({ status: false, message: "title should be Mr Mrs Miss" });
  }

  if (!name) {
    return res
      .status(400)
      .send({ status: false, message: "name is  Mandatory" });
  }
  if (!validName.test(name)) {
    return res.status(400).send({ status: false, message: "name is Invalid" });
  }
  if (!phone) {
    return res
      .status(400)
      .send({ status: false, message: "phoneNumber is  Mandatory" });
  }
  if (!validPhoneNumber.test(phone)) {
    return res
      .status(400)
      .send({ status: false, message: "phoneNumber is incorrect" });
  }
  if (!email) {
    return res
      .status(400)
      .send({ status: false, message: "email is  Mandatory" });
  }
  if (!emailValidator.validate(email)) {
    return res
      .status(400)
      .send({ status: false, message: "Provide email in correct format  " });
  }
  if (!password) {
    return res
      .status(400)
      .send({ status: false, message: "password is  Mandatory" });
  }
  if (!validPassword.test(password)) {
    return res.status(400).send({
      status: false,
      message:
        "password must have atleast 1 uppercase, 1 lowercase and 1 number, 1 special symbols(min8-max15 Ex-Functionup@123) ",
    });
  }
  let uniqueEmail = await userModel.findOne({ email: email });
  if (uniqueEmail) {
    return res
      .status(400)
      .send({ status: false, message: "Email already exist" });
  }
  let uniquePhone = await userModel.findOne({ phone: phone });
  if (uniquePhone) {
    return res
      .status(400)
      .send({ status: false, message: "Phone Number already exist" });
  }

  // if (address)

  if (req.body.hasOwnProperty("address")) {
    if (typeof address !== "object") {
      return res
        .status(400)
        .send({ status: false, message: "address is invalid type" });
    }
    if (Object.keys(address).length == 0)
      return res.status(400).send({
        status: false,
        message: "address must have atleast one Field",
      });

    const { street, city, pincode, ...rest } = req.body.address;
    if (Object.keys(rest).length > 0)
      return res.status(400).send({
        status: false,
        message: "Invalid attributes in address Field",
      });
    if (req.body.address.hasOwnProperty("street")) {
      if (!isValid(address.street))
        return res
          .status(400)
          .send({ status: false, message: "street name is Invalid" });
    }
    if (req.body.address.hasOwnProperty("city")) {
      if (!isValid(address.city))
        return res
          .status(400)
          .send({ status: false, message: "city name is Invalid" });
    }
    if (req.body.address.hasOwnProperty("pincode")) {
      if (isNaN(address.pincode))
        return res
          .status(400)
          .send({ status: false, message: "pincode should be a number" });
      if (address.pincode.length !== 6)
        return res
          .status(400)
          .send({ status: false, message: "pincode should be six digit only" });
    }
  }

  let userdata = await userModel.create(data);
  return res.status(201).send({ status: true, data: userdata });
};
/*--------LOGIN USER---------------*/
const loginUser = async function (req, res) {
  try {
    let email = req.body.email;
    let password = req.body.password;
    if (Object.keys(req.body).length === 0) {
      return res.status(400).send({
        status: false,
        message: "Please provide Email and Password details",
      });
    }
    if (!email)
      return res
        .status(400)
        .send({ status: false, message: "email is  Mandatory" });
    if (!password)
      return res
        .status(400)
        .send({ status: false, message: "password is  Mandatory" });
    let finduser = await userModel.findOne({
      email: email,
      password: password,
    });
    if (!finduser) {
      return res.status(400).send({
        status: false,
        message: "Please use correct email or password",
      });
    }

    /*JWT TOKEN */
    let token = jwt.sign(
      {
        userId: finduser._id.toString(),
        exp: Math.floor(Date.now() / 1000) + 10 * 60 * 60, //10day
      },
      "project-bookManagement"
    );
    res.setHeader("x-api-key", token);
    res
      .status(200)
      .send({ status: true, message: "Successfull", data: { token } });
  } catch (err) {
    return res.status(500).send({ msg: "Error", Error: err.message });
  }
};

module.exports.createUser = createUser;
module.exports.loginUser = loginUser;