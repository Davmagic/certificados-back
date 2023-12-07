const express = require("express");
const bcrypt = require("bcryptjs");
const { PrismaClient } = require("@prisma/client");
const PrismaHandlerError = require("../../../errors/handlers/Prisma");
const auth = require("../../../middleware/auth");

const router = express.Router()
const prisma = new PrismaClient({ log: ['query', 'info', 'warn', 'error'], })

/* students routes */
router.use(auth)
/*
  get all students
  method: GET
  route: /api/v1/students
*/
router.get('/', async (req, res) => {
  try {
    const students = await prisma.student.findMany({
      include: {
        user: { select: { name: true, lastname: true, email: true, dni: true } },
        _count: { select: { enrolls: true } }
      }
    })
    res.json(students)
  } catch (error) {
    res.status(500)
    PrismaHandlerError(error, res)
  }
})

/*
  get student by id
  method: GET
  route: /api/v1/students/:id
*/
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const student = await prisma.student.findUnique({
      where: { id },
      include: {
        user: true,
        _count: { select: { enrolls: true } }
      }
    })
    if (!student) {
      throw Error('student not found')
    }
    res.json(student)
  } catch (error) {
    res.status(404).send({ errors: [{ msg: 'student not found' }] })
  }
})

/* 
  get enrolls by student
  method POST
  route: /api/v1/students/:id/enrolls
*/
router.get('/:id/enrolls', async (req, res) => {
  try {
    const { id } = req.params
    const enrolls = await prisma.enroll.findMany({
      where: { studentId: id },
      orderBy: { finishedAt: "asc" },
      include: {
        course: {
          select: { name: true }
        }
      }
    })
    res.json(enrolls)
  } catch (error) {
    res.status(500).send({ errors: [{ msg: 'Internal server error' }] })
  }
})

/* 
  create student
  methos: POST
  route: /api/v1/students
*/
router.post('/', async (req, res) => {
  try {
    const { dni, email, password, name, lastname = '' } = req.body
    //Encrypt the password
    const salt = await bcrypt.genSalt(10)
    const hashpass = await bcrypt.hash(password, salt)

    const student = await prisma.student.create({
      data: {
        user: {
          create: {
            dni,
            email,
            password: hashpass,
            name,
            lastname,
            role: "STUDENT"
          }
        },
      },
      include: { user: true }
    })
    res.json(student)
  } catch (error) {
    res.status(500)
    PrismaHandlerError(error, res)
  }
})

/*
  enroll one student to a one or many courses
  methos: POST
  route: /api/v1/students/:id/enroll
*/
router.post('/:id/enroll', async (req, res) => {
  try {
    const { id } = req.params
    const { enrolls } = req.body
    const student = await prisma.student.update({
      where: { id },
      data: {
        enrolls: {
          createMany: {
            data: enrolls
          }
        }
      },
      include: {
        enrolls: {
          include: { course: { select: { name: true } } },
          orderBy: { finishedAt: "asc" }
        }
      }
    })
    res.json(student)
  } catch (error) {
    res.status(500)
    PrismaHandlerError(error, res)
  }
})

module.exports = router