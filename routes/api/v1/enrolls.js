const express = require("express");
const { PrismaClient } = require("@prisma/client");
const PrismaHandlerError = require("../../../errors/handlers/Prisma");
const auth = require("../../../middleware/auth");

const router = express.Router()
const prisma = new PrismaClient({ log: ['query', 'info', 'warn', 'error'], })

/*
  get all enrolls
  method: GET
  route: /api/v1/enrolls
*/
router.get('/', auth, async (req, res) => {
  try {
    const enrolls = await prisma.enroll.findMany({
      include: {
        course: { include: { academy: { select: { name: true } } } },
        student: true
      }
    })
    res.json(enrolls)
  } catch (error) {
    res.status(500)
    PrismaHandlerError(error, res)
  }
})

/*
  get all enrolls by user email
  methos: GET
  route: /api/v1/enrolls/search?lastname={user_lastname}&dni={user_dni}
*/
router.get('/search', async (req, res) => {
  try {
    const { lastname, dni } = req.query
    if(!lastname && !dni) return res.status(400).json({ errors: [{ msg: 'lastname or dni is required' }] })

    let filter = {}
    if(lastname){
      filter = { lastname: { equals: lastname, mode: 'insensitive' } }
    } else if(dni){
      filter = { dni: { equals: dni } }
    }
    const enrolls = await prisma.enroll.findMany({
      where: {
        student: filter
      },
      include: {
        course: { include: { academy: { select: { name: true } } } },
        student: true
      },
    })
    res.json(enrolls)
  } catch (error) {
    res.status(500)
    PrismaHandlerError(error, res)
  }
})

router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const enrolls = await prisma.enroll.findUnique({
      where: { id },
      include: {
        course: { include: { academy: { select: { name: true } } } },
        student: true
      }
    })
    res.json(enrolls)
  } catch (error) {
    res.status(500)
    PrismaHandlerError(error, res)
  }
})

/* 
  update enroll
  methos: PUT
  route: /api/v1/enrolls/:id
*/
router.put('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params
    const { emittedAt, bachelor } = req.body
    const enroll = await prisma.enroll.update({
      where: { id },
      data: {
        emittedAt,
        bachelor,
      }
    })
    res.json(enroll)
  } catch (error) {
    res.status(500)
    PrismaHandlerError(error, res)
  }
})

/* 
  delete enroll
  methos: POST
  route: /api/v1/enrolls
*/
router.delete('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params

    const enroll = await prisma.enroll.delete({
      where: { id }
    })
    res.json(enroll)
  } catch (error) {
    res.status(500)
    PrismaHandlerError(error, res)
  }
})

module.exports = router