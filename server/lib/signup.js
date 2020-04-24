const { Sequelize } = require("sequelize");
const md5 = require("md5");
const { isEmail } = require("./util");

const signup = async (req, res, User, Franchise) => {
  const { email, password, fid, username } = req.body;

  if (!email) {
    res.json({ response: "Email is mandatory" });
    return;
  }

  if (!isEmail(email)) {
    res.json({ response: "Incorrect email" });
    return;
  }
  if (!password || password.length < 6) {
    res.json({ response: "Password requires a minimum of 6 letters" });
    return;
  }

  if (!fid) {
    res.json({ response: "Forgot franchise" });
    return;
  }

  const franchise = await Franchise.findOne({ where: { id: fid } });
  if (!franchise) {
    res.json({ response: "That franchise doesn't exist" });
    return;
  }

  const already = await User.findOne({
    where: {
      $and: Sequelize.where(
        Sequelize.fn("lower", Sequelize.col("email")),
        Sequelize.fn("lower", email)
      ),
      fid,
    },
  });

  const usernameAlready = await User.findOne({
    where: {
      $and: Sequelize.where(
        Sequelize.fn("lower", Sequelize.col("username")),
        Sequelize.fn("lower", username)
      ),
      fid,
    },
  });

  if (already) {
    res.json({ response: "This email is already in use" });
    return;
  }
  if (usernameAlready) {
    res.json({ response: "This username is already in use" });
    return;
  }

  const { dataValues } = await User.create({
    username,
    email,
    password: md5(password),
    loginToken: Math.round(Math.random() * 9999999999999),
    fid,
  });

  res.json({
    loginToken: dataValues.loginToken,
    response: `You're logged in on ${dataValues.email}`,
  });
};

module.exports = { signup };
