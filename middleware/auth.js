const jwt = require("jsonwebtoken")

module.exports = function (req, res, next) {
  //Get token from header
  const token = req.header("x-auth-token")
  //if no token
  if (!token) {
    return res.status(401).json({ errors: [{ msg: "Denied Access" }] })
  }
  //Verify the token
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    req.user = decoded.user
    next()
  } catch (error) {
    return res.status(401).json({ errors: [{ msg: "Token is not valid" }] })
  }
}
