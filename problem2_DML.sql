USE library;

INSERT INTO author (author_id, name, country) VALUES
    (1, 'Naguib Mahfouz', 'Egypt'),
    (2, 'Jane Austen', 'England'),
    (3, 'Gabriel Garcia Marquez', 'Colombia');

INSERT INTO book (book_id, title, price, author_id) VALUES
    (1, 'Palace Walk', 14.99, 1),
    (2, 'The Cairo Trilogy', 24.50, 1),
    (3, 'Pride and Prejudice', 12.75, 2),
    (4, 'Sense and Sensibility', 11.25, 2),
    (5, 'One Hundred Years of Solitude', 18.00, 3),
    (6, 'Love in the Time of Cholera', 16.50, 3);
