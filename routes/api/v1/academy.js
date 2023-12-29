const express = require("express");
const { PrismaClient } = require("@prisma/client");
const PrismaHandlerError = require("../../../errors/handlers/Prisma");
const auth = require("../../../middleware/auth");

const router = express.Router()
const prisma = new PrismaClient({ log: ['query', 'info', 'warn', 'error'], })

/* academy routes */
router.use(auth)

router.get('/', async (req, res) => {
  try {
    const academies = await prisma.academy.findMany({
      include: {
        _count: { select: { courses: true } }
      }
    })
    res.json(academies)
  } catch (error) {
    res.status(500)
    PrismaHandlerError(error, res)
  }
})

router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const academy = await prisma.academy.findUnique({
      where: { id },
      include: {
        courses: { include: { _count: { select: { enrolls: true } } } }
      }
    })
    res.json(academy)
  } catch (error) {
    res.status(500)
    PrismaHandlerError(error, res)
  }
})

router.post('/', async (req, res) => {
  try {
    const { name } = req.body
    if (!name) return res.status(400).json({ errors: [{ msg: 'name is required' }] })
    const academy = await prisma.academy.create({ data: { name } })
    res.json(academy)
  } catch (error) {
    res.status(500)
    PrismaHandlerError(error, res)
  }
})

router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const { name, description = '' } = req.body
    if (!name) return res.status(400).json({ errors: [{ msg: 'name is required' }] })

    const currentAcademy = await prisma.academy.findUnique({ where: { id } })

    if (currentAcademy.name !== name) {
      const alreadyAcademy = await prisma.academy.findUnique({ where: { name } })
      if (alreadyAcademy) {
        return res.status(400).send({ errors: [{ msg: 'already name exists', code: 'DuplicatedValue' }] })
      }
    }
    const academy = await prisma.academy.update({ where: { id }, data: { name, description } })
    res.json(academy)
  } catch (error) {
    res.status(500)
    PrismaHandlerError(error, res)
  }
})

router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params

    const academy = await prisma.course.findMany({ where: { academyId: id } })
    if (academy.length > 0) return res.status(400).json({ errors: [{ msg: 'cannot delete academy with courses' }] })

    await prisma.academy.delete({ where: { id } })
    res.status(204).json()
  } catch (error) {
    res.status(500)
    PrismaHandlerError(error, res)
  }
})

module.exports = router