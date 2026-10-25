const { test, describe, before, beforeEach, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');

process.env.USE_MOCK_DB = 'true';

const libraryDb = require('../src/libraryDb');

let authors;
let books;
let nextAuthorId;
let nextBookId;

libraryDb.execute = async (sql, params = []) => {
  if (sql.startsWith('SELECT book_id, title, price, author_id, cover_image FROM book ORDER BY')) {
    return [[...books].sort((a, b) => a.book_id - b.book_id), []];
  }
  if (sql.startsWith('SELECT author_id, name, country, photo_image FROM author ORDER BY')) {
    return [[...authors].sort((a, b) => a.author_id - b.author_id), []];
  }
  if (sql.startsWith('SELECT book_id, title, price, author_id, cover_image FROM book WHERE')) {
    return [books.filter(book => book.book_id === params[0]), []];
  }
  if (sql.startsWith('SELECT author_id, name, country, photo_image FROM author WHERE')) {
    return [authors.filter(author => author.author_id === params[0]), []];
  }
  if (sql.startsWith('SELECT book_id, cover_image FROM book WHERE')) {
    return [books.filter(book => book.book_id === params[0]), []];
  }
  if (sql.startsWith('SELECT author_id, photo_image FROM author WHERE')) {
    return [authors.filter(author => author.author_id === params[0]), []];
  }
  if (sql.startsWith('SELECT photo_image FROM author WHERE')) {
    return [authors.filter(author => author.author_id === params[0]), []];
  }
  if (sql.startsWith('SELECT cover_image FROM book WHERE author_id')) {
    return [books.filter(book => book.author_id === params[0]), []];
  }
  if (sql.startsWith('SELECT cover_image FROM book WHERE')) {
    return [books.filter(book => book.book_id === params[0]), []];
  }
  if (sql.startsWith('INSERT INTO author')) {
    const author = { author_id: nextAuthorId++, name: params[0], country: params[1], photo_image: params[2] };
    authors.push(author);
    return [{ insertId: author.author_id, affectedRows: 1 }, []];
  }
  if (sql.startsWith('INSERT INTO book')) {
    const book = { book_id: nextBookId++, title: params[0], price: params[1], author_id: params[2], cover_image: params[3] };
    books.push(book);
    return [{ insertId: book.book_id, affectedRows: 1 }, []];
  }
  if (sql.startsWith('UPDATE author')) {
    const author = authors.find(item => item.author_id === params[3]);
    if (!author) return [{ affectedRows: 0 }, []];
    author.name = params[0];
    author.country = params[1];
    author.photo_image = params[2] || author.photo_image;
    return [{ affectedRows: 1 }, []];
  }
  if (sql.startsWith('UPDATE book')) {
    const book = books.find(item => item.book_id === params[4]);
    if (!book) return [{ affectedRows: 0 }, []];
    book.title = params[0];
    book.price = params[1];
    book.author_id = params[2];
    book.cover_image = params[3] || book.cover_image;
    return [{ affectedRows: 1 }, []];
  }
  if (sql.startsWith('DELETE FROM author')) {
    const authorId = params[0];
    const previousLength = authors.length;
    authors = authors.filter(author => author.author_id !== authorId);
    books = books.filter(book => book.author_id !== authorId);
    return [{ affectedRows: previousLength - authors.length }, []];
  }
  if (sql.startsWith('DELETE FROM book')) {
    const previousLength = books.length;
    books = books.filter(book => book.book_id !== params[0]);
    return [{ affectedRows: previousLength - books.length }, []];
  }
  throw new Error(`Unexpected library query in test: ${sql}`);
};

const app = require('../src/server');
let server;
let baseUrl;

describe('Lab 3 Library pages', () => {
  before(async () => {
    server = app.listen(0);
    await new Promise(resolve => server.once('listening', resolve));
    baseUrl = `http://127.0.0.1:${server.address().port}`;
  });

  beforeEach(() => {
    authors = [
      { author_id: 1, name: 'Naguib Mahfouz', country: 'Egypt', photo_image: null },
      { author_id: 2, name: 'Jane Austen', country: 'England', photo_image: null }
    ];
    books = [
      { book_id: 1, title: 'Palace Walk', price: '14.99', author_id: 1, cover_image: null }
    ];
    nextAuthorId = 3;
    nextBookId = 2;
  });

  after(async () => {
    await new Promise((resolve, reject) => server.close(err => err ? reject(err) : resolve()));
  });

  test('shows both tables and each book author_id without requiring login', async () => {
    const response = await fetch(`${baseUrl}/library`);
    const html = await response.text();

    assert.equal(response.status, 200);
    assert.match(html, /Palace Walk/);
    assert.match(html, /Author ID/);
    assert.match(html, /Naguib Mahfouz/);
    assert.match(html, /#1/);
  });

  test('shows image upload fields and the accepted formats on both forms', async () => {
    const [bookResponse, authorResponse] = await Promise.all([
      fetch(`${baseUrl}/library/books/new`),
      fetch(`${baseUrl}/library/authors/new`)
    ]);
    const [bookHtml, authorHtml] = await Promise.all([
      bookResponse.text(),
      authorResponse.text()
    ]);

    assert.equal(bookResponse.status, 200);
    assert.equal(authorResponse.status, 200);
    assert.match(bookHtml, /enctype="multipart\/form-data"/);
    assert.match(bookHtml, /name="image" accept="image\/jpeg,image\/png,image\/webp"/);
    assert.match(authorHtml, /name="image" accept="image\/jpeg,image\/png,image\/webp"/);
  });

  test('adds, edits, and removes a book', async () => {
    let response = await fetch(`${baseUrl}/library/books`, {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ title: 'New Book', price: '8.50', author_id: '2' }),
      redirect: 'manual'
    });
    assert.equal(response.status, 302);
    assert.equal(books.length, 2);

    response = await fetch(`${baseUrl}/library/books/2/edit`, {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ title: 'Updated Book', price: '9.25', author_id: '1' }),
      redirect: 'manual'
    });
    assert.equal(response.status, 302);
    assert.deepEqual(books[1], {
      book_id: 2,
      title: 'Updated Book',
      price: '9.25',
      author_id: 1,
      cover_image: null
    });

    response = await fetch(`${baseUrl}/library/books/2/delete`, {
      method: 'POST',
      redirect: 'manual'
    });
    assert.equal(response.status, 302);
    assert.equal(books.length, 1);
  });

  test('adds, edits, and removes an author and cascades their books', async () => {
    let response = await fetch(`${baseUrl}/library/authors`, {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ name: 'New Author', country: 'Egypt' }),
      redirect: 'manual'
    });
    assert.equal(response.status, 302);
    assert.equal(authors.length, 3);

    response = await fetch(`${baseUrl}/library/authors/1/edit`, {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ name: 'Updated Author', country: 'Egypt' }),
      redirect: 'manual'
    });
    assert.equal(response.status, 302);
    assert.equal(authors[0].name, 'Updated Author');

    response = await fetch(`${baseUrl}/library/authors/1/delete`, {
      method: 'POST',
      redirect: 'manual'
    });
    assert.equal(response.status, 302);
    assert.equal(authors.some(author => author.author_id === 1), false);
    assert.equal(books.some(book => book.author_id === 1), false);
  });

  test('rejects invalid form values without inserting records', async () => {
    const response = await fetch(`${baseUrl}/library/books`, {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ title: '   ', price: '-1', author_id: '999' })
    });
    const html = await response.text();

    assert.equal(response.status, 400);
    assert.match(html, /Book title is required/);
    assert.match(html, /Price must be a non-negative amount/);
    assert.equal(books.length, 1);
  });

  test('uploads a cover and author photo, serves them, and removes them with their records', async () => {
    const png = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/pfoAAAAASUVORK5CYII=',
      'base64'
    );
    const uploadImage = async (url, values, filename) => {
      const form = new FormData();
      for (const [key, value] of Object.entries(values)) form.append(key, value);
      form.append('image', new Blob([png], { type: 'image/png' }), filename);
      return fetch(`${baseUrl}${url}`, { method: 'POST', body: form, redirect: 'manual' });
    };

    let response = await uploadImage('/library/books', {
      title: 'Illustrated Book',
      price: '10.00',
      author_id: '1'
    }, 'cover.png');
    assert.equal(response.status, 302);
    const coverFilename = books[1].cover_image;
    assert.match(coverFilename, /^[0-9a-f-]{36}\.png$/);

    response = await fetch(`${baseUrl}/uploads/library/${coverFilename}`);
    assert.equal(response.status, 200);
    assert.equal(response.headers.get('content-type'), 'image/png');

    response = await uploadImage('/library/authors', {
      name: 'Photo Author',
      country: 'Egypt'
    }, 'portrait.png');
    assert.equal(response.status, 302);
    const author = authors.find(item => item.name === 'Photo Author');
    assert.match(author.photo_image, /^[0-9a-f-]{36}\.png$/);

    response = await fetch(`${baseUrl}/library`);
    const libraryHtml = await response.text();
    assert.match(libraryHtml, new RegExp(`/uploads/library/${coverFilename}`));
    assert.match(libraryHtml, new RegExp(`/uploads/library/${author.photo_image}`));

    response = await uploadImage(`/library/books/${books[1].book_id}/edit`, {
      title: 'Illustrated Book',
      price: '10.00',
      author_id: '1'
    }, 'replacement.png');
    assert.equal(response.status, 302);
    const replacedCover = books[1].cover_image;
    assert.notEqual(replacedCover, coverFilename);
    await assert.rejects(fs.access(path.join(__dirname, '..', 'public', 'uploads', 'library', coverFilename)));

    response = await fetch(`${baseUrl}/library/books/${books[1].book_id}/delete`, {
      method: 'POST',
      redirect: 'manual'
    });
    assert.equal(response.status, 302);
    await assert.rejects(fs.access(path.join(__dirname, '..', 'public', 'uploads', 'library', replacedCover)));

    response = await fetch(`${baseUrl}/library/authors/${author.author_id}/delete`, {
      method: 'POST',
      redirect: 'manual'
    });
    assert.equal(response.status, 302);
    await assert.rejects(fs.access(path.join(__dirname, '..', 'public', 'uploads', 'library', author.photo_image)));
  });

  test('rejects an image whose contents do not match an allowed image format', async () => {
    const form = new FormData();
    form.append('title', 'Not an image');
    form.append('price', '2.00');
    form.append('author_id', '1');
    form.append('image', new Blob(['not really png'], { type: 'image/png' }), 'fake.png');

    const response = await fetch(`${baseUrl}/library/books`, {
      method: 'POST',
      body: form
    });
    const html = await response.text();

    assert.equal(response.status, 400);
    assert.match(html, /not a valid JPEG, PNG, or WebP image/);
    assert.equal(books.length, 1);
  });
});
