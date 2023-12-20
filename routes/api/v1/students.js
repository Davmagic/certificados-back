const express = require("express");
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
  search student
  methos: GET
  route: /api/v1/student/search?dni={dni}
 */
router.get('/search', async (req, res) => {
  try {
    const { dni } = req.query
    if (!dni) {
      throw Error('dni is required')
    }
    const user = await prisma.student.findUnique({
      where: { dni },
      select: { dni: true }
    })
    res.json(user)
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
      orderBy: { emittedAt: "desc" },
      include: { course: { include: { academy: { select: { name: true } } } } }
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
    const { dni, partner, name, lastname = '' } = req.body

    const student = await prisma.student.create({
      data: {
        dni,
        name,
        lastname,
        partner
      },
    })
    res.status(201).json(student)
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
      }
    })
    res.json(student)
  } catch (error) {
    res.status(500)
    PrismaHandlerError(error, res)
  }
})

/*
  update user
  method: PUT
  route: /api/v1/students/:id
*/
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const { dni, partner, name, lastname = '' } = req.body

    const currentUser = await prisma.student.findUnique({ where: { id } })

    if (currentUser.dni !== dni) {
      const alreadyUser = await prisma.student.findUnique({ where: { dni } })
      if (alreadyUser) {
        return res.status(400).send({ errors: [{ msg: 'already dni exists', code: 'DuplicatedValue' }] })
      }
    }

    const user = await prisma.user.update({
      where: { id },
      data: {
        dni, name, lastname, partner
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
  route: /api/v1/students/:id
*/
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const transation = await prisma.$transaction([
      prisma.enroll.deleteMany({ where: { studentId: id } }),
      prisma.student.delete({ where: { id } })
    ])
    res.json(transation)
  } catch (error) {
    res.status(500)
    PrismaHandlerError(error, res)
  }
})

module.exports = router