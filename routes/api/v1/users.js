const express = require("express");
const bcrypt = require("bcryptjs");
const { PrismaClient } = require("@prisma/client");
const { check, validationResult } = require("express-validator")

const PrismaHandlerError = require("../../../errors/handlers/Prisma");
const auth = require("../../../middleware/auth");

const router = express.Router()
const prisma = new PrismaClient({ log: ['query', 'info', 'warn', 'error'], })

/* 
  create user
  methos: POST
  route: /api/v1/users
*/
router.post(
  '/',
  [
    check('name', 'you must be type a valid name').notEmpty(),
    check('email', 'Please enter a valid email').isEmail(),
    check('password', 'Please enter a valid password').isLength({ min: 8 })
  ],
  async (req, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }
    try {
      const { email, password, name, lastname = '' } = req.body
      //Encrypt the password
      const salt = await bcrypt.genSalt(10)
      const hashpass = await bcrypt.hash(password, salt)

      const user = await prisma.admin.create({
        data: {
          email,
          password: hashpass,
          name,
          lastname,
        }
      })
      res.json(user)
    } catch (error) {
      res.status(500)
      PrismaHandlerError(error, res)
    }
  })

/* users routes */
router.use(auth)

/*
  get all users
  method: GET
  route: /api/v1/users
*/
router.get('/', async (req, res) => {
  try {
    const users = await prisma.admin.findMany()
    res.json(users)
  } catch (error) {
    res.status(500)
    PrismaHandlerError(error, res)
  }
})

/* 
  search users
  methos: GET
  route: /api/v1/users/search?email={email}&dni={dni}
 */
router.get('/search', async (req, res) => {
  try {
    const { email } = req.query
    if (!email) {
      throw Error('email is required')
    }
    const user = await prisma.admin.findUnique({
      where: { email }
    })
    res.json(user)
  } catch (error) {
    res.status(500)
    PrismaHandlerError(error, res)
  }
})

/*
  get user by id
  method: GET
  route: /api/v1/users/:id
*/
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const user = await prisma.admin.findUnique({
      where: { id }
    })
    if (!user) {
      throw Error('user not found')
    }
    res.json(user)
  } catch (error) {
    res.status(404).send({ errors: [{ msg: 'user not found' }] })
  }
})

/*
  update user
  method: PUT
  route: /api/v1/users/:id
*/
router.put(
  '/:id',
  [

  ],
  async (req, res) => {
    try {
      const { id } = req.params
      const { email, name, lastname = '' } = req.body

      const currentUser = await prisma.admin.findUnique({ where: { id } })

      if (currentUser.email !== email) {
        const alreadyUser = await prisma.admin.findUnique({ where: { email } })
        if (alreadyUser) {
          return res.status(400).send({ errors: [{ msg: 'already email exists' }] })
        }
      }

      const user = await prisma.admin.update({
        where: { id },
        data: {
          email, name, lastname
        }
      })
      res.json(user)
    } catch (error) {
      res.status(500)
      PrismaHandlerError(error, res)
    }
  })

/*
  delete user
  method: DELETE
  route: /api/v1/users/:id
*/
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const admin = await prisma.admin.delete({ where: { id } })
    res.json(admin)
  } catch (error) {
    res.status(500)
    PrismaHandlerError(error, res)
  }
})

module.exports = router