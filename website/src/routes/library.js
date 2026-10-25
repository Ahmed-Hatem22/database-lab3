const express = require('express');
const db = require('../libraryDb');
const {
  handleImageUpload,
  uploadedImageError,
  saveUploadedImage,
  removeUploadedImage
} = require('../imageUploads');

const router = express.Router();
const AUTHOR_NAME_MAX = 100;
const COUNTRY_MAX = 80;
const BOOK_TITLE_MAX = 200;

function validId(value) {
  return typeof value === 'string' && /^\d+$/.test(value) && Number(value) > 0;
}

function renderLibraryPage(res, status, errors, values = {}) {
  return db.execute(
    'SELECT book_id, title, price, author_id, cover_image FROM book ORDER BY book_id;',
    []
  ).then(async ([books]) => {
    const [authors] = await db.execute(
      'SELECT author_id, name, country, photo_image FROM author ORDER BY author_id;',
      []
    );
    return res.status(status).render('library/index', {
      title: 'Library | EduStudy',
      libraryStyles: true,
      books,
      authors,
      errors,
      ...values
    });
  });
}

async function loadAuthors() {
  const [authors] = await db.execute(
    'SELECT author_id, name, country, photo_image FROM author ORDER BY name;',
    []
  );
  return authors;
}

function validateAuthor(name, country) {
  const errors = [];
  if (typeof name !== 'string' || !name.trim()) errors.push('Author name is required.');
  else if (name.trim().length > AUTHOR_NAME_MAX) errors.push(`Author name must be ${AUTHOR_NAME_MAX} characters or fewer.`);
  if (typeof country !== 'string' || !country.trim()) errors.push('Country is required.');
  else if (country.trim().length > COUNTRY_MAX) errors.push(`Country must be ${COUNTRY_MAX} characters or fewer.`);
  return errors;
}

function validateBook(title, price, authorId) {
  const errors = [];
  if (typeof title !== 'string' || !title.trim()) errors.push('Book title is required.');
  else if (title.trim().length > BOOK_TITLE_MAX) errors.push(`Book title must be ${BOOK_TITLE_MAX} characters or fewer.`);
  if (typeof price !== 'string' || !/^\d{1,8}(?:\.\d{1,2})?$/.test(price.trim())) {
    errors.push('Price must be a non-negative amount with up to 8 whole-number digits and 2 decimal places.');
  }
  if (!authorId || !validId(authorId)) errors.push('Select a valid author.');
  return errors;
}

router.get('/library', async (req, res, next) => {
  try {
    await renderLibraryPage(res, 200, []);
  } catch (err) {
    next(err);
  }
});

router.get('/library/books/new', async (req, res, next) => {
  try {
    res.render('library/book-form', {
      title: 'Add a Book | EduStudy',
      libraryStyles: true,
      authors: await loadAuthors(),
      book: null,
      errors: []
    });
  } catch (err) {
    next(err);
  }
});

router.post('/library/books', handleImageUpload, async (req, res, next) => {
  const { title, price, author_id: authorId } = req.body;
  const errors = validateBook(title, price, authorId);
  if (req.imageUploadError) errors.push(req.imageUploadError);
  const imageError = uploadedImageError(req.file);
  if (imageError) errors.push(imageError);
  try {
    if (errors.length) {
      return res.status(400).render('library/book-form', {
        title: 'Add a Book | EduStudy',
        libraryStyles: true,
        authors: await loadAuthors(),
        book: { title, price, author_id: authorId },
        errors
      });
    }
    const coverImage = await saveUploadedImage(req.file);
    try {
      await db.execute(
        'INSERT INTO book (title, price, author_id, cover_image) VALUES (?, ?, ?, ?);',
        [title.trim(), price.trim(), Number(authorId), coverImage]
      );
    } catch (err) {
      await removeUploadedImage(coverImage);
      throw err;
    }
    return res.redirect('/library');
  } catch (err) {
    if (err.code === 'ER_NO_REFERENCED_ROW_2') {
      return res.status(400).render('library/book-form', {
        title: 'Add a Book | EduStudy',
        libraryStyles: true,
        authors: await loadAuthors(),
        book: { title, price, author_id: authorId },
        errors: ['The selected author no longer exists. Choose an existing author.']
      });
    }
    next(err);
  }
});

router.get('/library/books/:id/edit', async (req, res, next) => {
  if (!validId(req.params.id)) return res.sendStatus(404);
  try {
    const [rows] = await db.execute(
      'SELECT book_id, title, price, author_id, cover_image FROM book WHERE book_id = ?;',
      [Number(req.params.id)]
    );
    if (!rows.length) return res.sendStatus(404);
    return res.render('library/book-form', {
      title: 'Edit a Book | EduStudy',
      libraryStyles: true,
      authors: await loadAuthors(),
      book: rows[0],
      errors: []
    });
  } catch (err) {
    next(err);
  }
});

router.post('/library/books/:id/edit', handleImageUpload, async (req, res, next) => {
  if (!validId(req.params.id)) return res.sendStatus(404);
  const { title, price, author_id: authorId } = req.body;
  const book = { book_id: Number(req.params.id), title, price, author_id: authorId };
  const errors = validateBook(title, price, authorId);
  if (req.imageUploadError) errors.push(req.imageUploadError);
  const imageError = uploadedImageError(req.file);
  if (imageError) errors.push(imageError);
  try {
    const [existingRows] = await db.execute(
      'SELECT book_id, cover_image FROM book WHERE book_id = ?;',
      [Number(req.params.id)]
    );
    if (!existingRows.length) return res.sendStatus(404);
    book.cover_image = existingRows[0].cover_image;
    const previousCoverImage = existingRows[0].cover_image;
    if (errors.length) {
      return res.status(400).render('library/book-form', {
        title: 'Edit a Book | EduStudy',
        libraryStyles: true,
        authors: await loadAuthors(),
        book,
        errors
      });
    }
    const coverImage = await saveUploadedImage(req.file);
    let result;
    try {
      [result] = await db.execute(
        'UPDATE book SET title = ?, price = ?, author_id = ?, cover_image = COALESCE(?, cover_image) WHERE book_id = ?;',
        [title.trim(), price.trim(), Number(authorId), coverImage, Number(req.params.id)]
      );
    } catch (err) {
      await removeUploadedImage(coverImage);
      throw err;
    }
    if (!result.affectedRows) {
      await removeUploadedImage(coverImage);
      return res.sendStatus(404);
    }
    if (coverImage) await removeUploadedImage(previousCoverImage);
    return res.redirect('/library');
  } catch (err) {
    if (err.code === 'ER_NO_REFERENCED_ROW_2') {
      return res.status(400).render('library/book-form', {
        title: 'Edit a Book | EduStudy',
        libraryStyles: true,
        authors: await loadAuthors(),
        book,
        errors: ['The selected author no longer exists. Choose an existing author.']
      });
    }
    next(err);
  }
});

router.post('/library/books/:id/delete', async (req, res, next) => {
  if (!validId(req.params.id)) return res.sendStatus(404);
  try {
    const [rows] = await db.execute(
      'SELECT cover_image FROM book WHERE book_id = ?;',
      [Number(req.params.id)]
    );
    if (!rows.length) return res.sendStatus(404);
    const [result] = await db.execute(
      'DELETE FROM book WHERE book_id = ?;',
      [Number(req.params.id)]
    );
    if (!result.affectedRows) return res.sendStatus(404);
    await removeUploadedImage(rows[0].cover_image);
    return res.redirect('/library');
  } catch (err) {
    next(err);
  }
});

router.get('/library/authors/new', (req, res) => {
  res.render('library/author-form', {
    title: 'Add an Author | EduStudy',
    libraryStyles: true,
    author: null,
    errors: []
  });
});

router.post('/library/authors', handleImageUpload, async (req, res, next) => {
  const { name, country } = req.body;
  const errors = validateAuthor(name, country);
  if (req.imageUploadError) errors.push(req.imageUploadError);
  const imageError = uploadedImageError(req.file);
  if (imageError) errors.push(imageError);
  if (errors.length) {
    return res.status(400).render('library/author-form', {
      title: 'Add an Author | EduStudy',
      libraryStyles: true,
      author: { name, country },
      errors
    });
  }
  try {
    const photoImage = await saveUploadedImage(req.file);
    try {
      await db.execute(
        'INSERT INTO author (name, country, photo_image) VALUES (?, ?, ?);',
        [name.trim(), country.trim(), photoImage]
      );
    } catch (err) {
      await removeUploadedImage(photoImage);
      throw err;
    }
    return res.redirect('/library');
  } catch (err) {
    next(err);
  }
});

router.get('/library/authors/:id/edit', async (req, res, next) => {
  if (!validId(req.params.id)) return res.sendStatus(404);
  try {
    const [rows] = await db.execute(
      'SELECT author_id, name, country, photo_image FROM author WHERE author_id = ?;',
      [Number(req.params.id)]
    );
    if (!rows.length) return res.sendStatus(404);
    return res.render('library/author-form', {
      title: 'Edit an Author | EduStudy',
      libraryStyles: true,
      author: rows[0],
      errors: []
    });
  } catch (err) {
    next(err);
  }
});

router.post('/library/authors/:id/edit', handleImageUpload, async (req, res, next) => {
  if (!validId(req.params.id)) return res.sendStatus(404);
  const { name, country } = req.body;
  const author = { author_id: Number(req.params.id), name, country };
  const errors = validateAuthor(name, country);
  if (req.imageUploadError) errors.push(req.imageUploadError);
  const imageError = uploadedImageError(req.file);
  if (imageError) errors.push(imageError);
  let existingRows;
  let previousPhotoImage;
  try {
    [existingRows] = await db.execute(
      'SELECT author_id, photo_image FROM author WHERE author_id = ?;',
      [Number(req.params.id)]
    );
    if (!existingRows.length) return res.sendStatus(404);
    author.photo_image = existingRows[0].photo_image;
    previousPhotoImage = existingRows[0].photo_image;
  } catch (err) {
    return next(err);
  }
  if (errors.length) {
    return res.status(400).render('library/author-form', {
      title: 'Edit an Author | EduStudy',
      libraryStyles: true,
      author,
      errors
    });
  }
  try {
    const photoImage = await saveUploadedImage(req.file);
    let result;
    try {
      [result] = await db.execute(
        'UPDATE author SET name = ?, country = ?, photo_image = COALESCE(?, photo_image) WHERE author_id = ?;',
        [name.trim(), country.trim(), photoImage, Number(req.params.id)]
      );
    } catch (err) {
      await removeUploadedImage(photoImage);
      throw err;
    }
    if (!result.affectedRows) return res.sendStatus(404);
    if (photoImage) await removeUploadedImage(previousPhotoImage);
    return res.redirect('/library');
  } catch (err) {
    next(err);
  }
});

router.post('/library/authors/:id/delete', async (req, res, next) => {
  if (!validId(req.params.id)) return res.sendStatus(404);
  try {
    const [authors] = await db.execute(
      'SELECT photo_image FROM author WHERE author_id = ?;',
      [Number(req.params.id)]
    );
    if (!authors.length) return res.sendStatus(404);
    const [books] = await db.execute(
      'SELECT cover_image FROM book WHERE author_id = ?;',
      [Number(req.params.id)]
    );
    const [result] = await db.execute(
      'DELETE FROM author WHERE author_id = ?;',
      [Number(req.params.id)]
    );
    if (!result.affectedRows) return res.sendStatus(404);
    await Promise.all([
      removeUploadedImage(authors[0].photo_image),
      ...books.map(book => removeUploadedImage(book.cover_image))
    ]);
    return res.redirect('/library');
  } catch (err) {
    next(err);
  }
});

module.exports = router;
