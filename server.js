require('dotenv').config()
const express = require('express')
const cors = require('cors')
const bodyParse = require('body-parser')

const PORT = process.env.PORT || 8000
const app = express()

app.use(cors())
app.use(bodyParse.json())
app.use(bodyParse.urlencoded({ extended: true }))

app.use('/api/v1/users', require('./routes/api/v1/users'))
app.use('/api/v1/students', require('./routes/api/v1/students'))
app.use('/api/v1/courses', require('./routes/api/v1/courses'))
app.use('/api/v1/enrolls', require('./routes/api/v1/enrolls'))
app.use('/api/v1/auth', require('./routes/api/v1/auth'))
app.get('*', function (req, res) {
  res.status(404).send({ errors: [{ msg: 'error 404 not found' }] });
});

app.listen(PORT, () => {
  console.log(`Example app listening on PORT ${PORT}`)
})