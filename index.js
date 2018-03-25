const express = require('express')
const cors = require('cors')
const bodyParser = require('body-parser')
const fetch = require('node-fetch')
const { Pool } = require('pg')
const app = express()

const {bookFromApi, includeBookFromApi, bookFromData, noteFromData, tagFromData} = require('./bookUtil')

app.use(cors({origin: 'http://localhost:8080'}))
app.use(bodyParser.json())

const port = 3001

const pgConfig = require('./pgConfig')

app.get('/lookup', async (req, res) => {
  const q = req.query.q

  if (!q) {
    return res.status(400).send('Missing required q param')
  }

  try {
    const response = await fetch(`https://www.googleapis.com/books/v1/volumes?orderBy=relevance&maxResults=10&&q=${q}`)
    const bookData = await response.json()

    const books = (bookData.items || [])
      .filter(includeBookFromApi)
      .map(bookFromApi)
      .slice(0, 5)
  
    res.send(books)
  } catch(e) {
    console.log(e)
    res.status(500).send(e)
  }
})

app.get('/books', async (req, res) => {
  const pool = new Pool(pgConfig)
  let postRes

  try {
    postRes = await pool.query('SELECT * from books')
  } catch(e) {
    console.log(e)
    return res.status(500).send(e)
  }

  const books = postRes.rows.map(bookFromData)

  res.send(books)
})

app.get('/book', async (req, res) => {
  const pool = new Pool(pgConfig)
  const bookId = req.query.bookId
  let selectRes, notesRes

  if (!bookId) {
    return res.status(400).send('Missing required bookId param')
  }

  try {
    selectRes = await pool.query(`SELECT * FROM books where book_id = $1`, [bookId])
    notesRes = await pool.query(`SELECT * FROM notes where book_id = $1`, [bookId])
  } catch(e) {
    console.log(e)
    return res.status(500).send(e)
  }

  if (!selectRes.rowCount > 0) {
    res.status(404).send('Book not found')
  }

  const book = bookFromData(selectRes.rows[0])
  book.notes = notesRes.rowCount > 0 ? notesRes.rows.map(noteFromData) : []

  for(const note of book.notes) {
    try {
      const tagRes = await pool.query(`SELECT * FROM tags where note_id = $1`, [note.id])
      note.tags = tagRes.rowCount > 0 ? tagRes.rows.map(tagFromData) : []
    } catch(e) {
      console.log(e)
    }
  }

  res.send(book)
})

app.post('/book', async (req, res) => {
  const pool = new Pool(pgConfig)
  const book = req.body
  let insertRes

  try {
    insertRes = await pool.query(
      `INSERT INTO books(book_id, authors, average_rating, categories, description, thumbnail, small_thumbnail, ratings_count, title) VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [book.bookId, book.authors, book.averageRating, book.categories, book.description, book.imageLinks.thumbnail, book.imageLinks.smallThumbnail, book.ratingsCount, book.title]
    )
  } catch(e) {
    console.log(e)
    return res.status(500).send(e)
  }

  const bookRes = bookFromData(insertRes.rows[0])

  res.status(201).send(bookRes)
})

app.delete('/book', async (req, res) => {
  const pool = new Pool(pgConfig)
  const id = req.query.id
  let deleteRes

  if (!id) {
    return res.status(400).send('Missing required id param')
  }

  try {
    deleteREs = await pool.query(
      `DELETE FROM books where id = $1`,
      [id]
    )
  } catch(e) {
    console.log(e)
    return res.status(500).send(e)
  }

  res.status(200).send(id)
})

app.post('/note', async (req, res) => {
  const pool = new Pool(pgConfig)
  const note = req.body
  let insertRes

  try {
    insertRes = await pool.query(
      `INSERT INTO notes(book_id, content) VALUES($1, $2) RETURNING *`,
      [note.bookId, note.content]
    )
  } catch(e) {
    console.log(e)
    return res.status(500).send(e)
  }

  const noteRes = noteFromData(insertRes.rows[0])

  res.status(201).send(noteRes)
})

app.patch('/note', async (req, res) => {
  const pool = new Pool(pgConfig)
  const note = req.body
  let updateRes

  try {
    updateRes = await pool.query(
      `UPDATE notes SET content = $1 WHERE id = $2 RETURNING *`,
      [note.content, note.id]
    )
  } catch(e) {
    console.log(e)
    return res.status(500).send(e)
  }

  const noteRes = noteFromData(updateRes.rows[0])

  res.status(200).send(noteRes)
})

app.delete('/note', async (req, res) => {
  const pool = new Pool(pgConfig)
  const id = req.query.id
  let deleteRes

  if (!id) {
    return res.status(400).send('Missing required id param')
  }

  try {
    deleteREs = await pool.query(
      `DELETE FROM notes where id = $1`,
      [id]
    )
  } catch(e) {
    console.log(e)
    return res.status(500).send(e)
  }

  res.status(200).send(id)
})

app.post('/tag', async (req, res) => {
  const pool = new Pool(pgConfig)
  const tag = req.body
  let insertRes

  try {
    insertRes = await pool.query(
      `INSERT INTO tags(note_id, content) VALUES($1, $2) RETURNING *`,
      [tag.noteId, tag.content]
    )
  } catch(e) {
    console.log(e)
    return res.status(500).send(e)
  }

  const tagRes = tagFromData(insertRes.rows[0])

  res.status(201).send(tagRes)
})

app.delete('/tag', async (req, res) => {
  const pool = new Pool(pgConfig)
  const id = req.query.id
  let deleteRes

  if (!id) {
    return res.status(400).send('Missing required id param')
  }

  try {
    deleteREs = await pool.query(
      `DELETE FROM tags where id = $1`,
      [id]
    )
  } catch(e) {
    console.log(e)
    return res.status(500).send(e)
  }

  res.status(200).send(id)
})

app.listen(port, () => {
  console.log(`Listening on port ${port}`)
})
