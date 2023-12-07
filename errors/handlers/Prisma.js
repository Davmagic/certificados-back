const { Prisma } = require("@prisma/client");

function PrismaHandlerError(error, res) {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P2002') {
      return res.send({ errors: [{ msg: 'Unique constraint failed on one field' }] })
    }
    if (error.code === 'P2025') {
      return res.send({ errors: [{ msg: 'Record to delete does not exist.' }] })
    }
  }
  res.send({ errors: [{ msg: 'unhandle prisma error', ...error }] })
}

module.exports = PrismaHandlerError