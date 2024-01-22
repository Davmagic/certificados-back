const express = require("express");
const { PrismaClient } = require("@prisma/client");
const PrismaHandlerError = require("../../../errors/handlers/Prisma");
const auth = require("../../../middleware/auth");

const router = express.Router()
const prisma = new PrismaClient({ log: ['query', 'info', 'warn', 'error'], })

/* courses routes */
router.use(auth)
/*
  get all courses
  method: GET
  route: /api/v1/courses
*/
router.get('/', async (req, res) => {
  try {
    const courses = await prisma.course.findMany({
      include: {
        academy: { select: { name: true } },
        _count: { select: { enrolls: true } }
      },
      orderBy: { name: "asc" }
    })
    res.json(courses)
  } catch (error) {
    res.status(500)
    PrismaHandlerError(error, res)
  }
})

router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const course = await prisma.course.findUnique({
      where: { id },
      include: {
        academy: { select: { name: true } },
        _count: { select: { enrolls: true } }
      }
    })
    if (!course) {
      return res.status(404).json({ errors: [{ msg: 'Course not found' }] })
    }
    res.json(course)
  } catch (error) {
    res.status(500)
    PrismaHandlerError(error, res)
  }
})

/* 
  get all enrolls by course id
  method: GET
  route: /api/v1/courses/:id/enrolls
*/

router.get('/:id/enrolls', async (req, res) => {
  try {
    const { id } = req.params
    const enrolls = await prisma.enroll.findMany({
      where: { courseId: id },
      orderBy: { emittedAt: "desc" },
      include: { student: true, course: { include: { academy: { select: { name: true } } } } }
    })
    res.json(enrolls)
  } catch (error) {

  }
})

router.post('/', async (req, res) => {
  try {
    const data = req.body
    const course = await prisma.course.create({ data })
    res.status(201).json(course)
  } catch (error) {
    res.status(500)
    PrismaHandlerError(error, res)
  }
})

router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const data = req.body
    const course = await prisma.course.update({
      where: { id },
      data
    })
    res.json(course)
  } catch (error) {
    res.status(500)
    PrismaHandlerError(error, res)
  }
})

router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const deleteEnrolls = prisma.enroll.deleteMany({
      where: { courseId: id }
    })
    const deleteCourse = prisma.course.delete({
      where: { id }
    })
    const transation = await prisma.$transaction([deleteEnrolls, deleteCourse])
    res.json(transation)
  } catch (error) {
    res.status(500)
    PrismaHandlerError(error, res)
  }
})

module.exports = router