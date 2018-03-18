function includeBookFromApi(data) {
  return data.volumeInfo && data.volumeInfo.authors && data.volumeInfo.imageLinks
}

function bookFromApi(data) {
  return {
    bookId: data.id,
    title: data.volumeInfo.title,
    authors: data.volumeInfo.authors,
    description: data.volumeInfo.description,
    imageLinks: data.volumeInfo.imageLinks,
    categories: data.volumeInfo.categories,
    averageRating: data.volumeInfo.averageRating,
    ratingsCount: data.volumeInfo.ratingsCount
  }
}

function bookFromData(data) {
  return {
    id: data.id,
    bookId: data.book_id,
    title: data.title,
    authors: data.authors,
    description: data.description,
    imageLinks: {
      thumbnail: data.thumbnail,
      smallThumbnail: data.small_thumbnail
    },
    categories: data.categories,
    averageRating: data.average_rating,
    ratingsCount: data.ratings_count,
    createdAt: data.created_at
  }
}

function noteFromData(data) {
  return {
    id: data.id,
    bookId: data.book_id,
    content: data.content,
    createdAt: data.created_at
  }
}

function tagFromData(data) {
  return {
    id: data.id,
    noteId: data.note_id,
    content: data.content
  }
}

module.exports = {includeBookFromApi, bookFromApi, bookFromData, noteFromData, tagFromData}
