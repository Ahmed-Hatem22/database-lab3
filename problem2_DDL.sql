DROP DATABASE IF EXISTS library;
CREATE DATABASE library;
USE library;

CREATE TABLE author (
    author_id INT NOT NULL AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    country VARCHAR(80) NOT NULL,
    photo_image VARCHAR(80),
    PRIMARY KEY (author_id)
);

CREATE TABLE book (
    book_id INT NOT NULL AUTO_INCREMENT,
    title VARCHAR(200) NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    author_id INT NOT NULL,
    cover_image VARCHAR(80),
    PRIMARY KEY (book_id),
    FOREIGN KEY (author_id) REFERENCES author(author_id)
        ON DELETE CASCADE
);
