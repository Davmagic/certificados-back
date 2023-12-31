const express = require("express")
const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")
const { serialize } = require("cookie")
const { PrismaClient } = require("@prisma/client");
const { check, validationResult } = require("express-validator")

const auth = require("../../../middleware/auth")
const PrismaHandlerError = require("../../../errors/handlers/Prisma");

const router = express.Router()
const prisma = new PrismaClient({ log: ['query', 'info', 'warn', 'error'], })

//@route  GET api/v1/auth
//@desc   Get the token user information
//@access Private

router.get("/", auth, async (req, res) => {
  try {
    const admin = await prisma.admin.findUnique({
      where: { id: req.user.id },
      select: { id: true, email: true, isActive: true, name: true, lastname: true, role: true }
    })
    res.json(admin)
  } catch (error) {
    res.status(500).send("Server Error")
  }
})

//@route  POST api/v1/auth
//@desc   Authenticate user & get token
//@access Private

router.post(
  "/",
  check("email", "Please enter a valid email").isEmail(),
  check("password", "Please enter a password").exists(),
  async (req, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }
    const { email, password } = req.body

    try {
      //Check if admin already exists
      let admin = await prisma.admin.findUnique({ where: { email } })
      if (!admin) {
        return res
          .status(400)
          .json({ errors: [{ msg: "Invalid credentials" }] })
      }

      const passwordMatch = await bcrypt.compare(password, admin.password)

      if (!passwordMatch) {
        return res
          .status(400)
          .json({ errors: [{ msg: "Invalid credentials" }] })
      }

      //Return the webtoken
      const payload = {
        user: {
          id: admin.id,
        },
      }

      const token = jwt.sign(
        payload,
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN },
      )

      const serialized = serialize('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'none',
        path: '/',
        maxAge: process.env.JWT_EXPIRES_IN,
      })
      res.setHeader('Set-Cookie', serialized)
      res.json({
        name: admin.name,
        lastname: admin.lastname,
        email: admin.email,
        token
      })
    } catch (error) {
      console.error(error)
      res.status(500)
      PrismaHandlerError(error, res)
    }
  }
)

router.post('/logout', auth, (req, res) => {
  const serialized = serialize('token', null, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'none',
    path: '/',
    maxAge: 0,
  })
  res.setHeader('Set-Cookie', serialized)
  res.json({ message: 'Logout successful' })
})

module.exports = router
