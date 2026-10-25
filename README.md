# Database Lab 3 — Part II: Library

**Student:** Ahmed Hatem  
**Student ID:** 2304158  
**Course:** Introduction to Database Systems — Alexandria National University, Faculty of Engineering

This submission implements Part II (Problem 2) of Lab 3. The website continues the Lab 2 Node.js/Express application and adds a library section. The books/authors feature uses its own `library` MySQL database; the Lab 2 study planner keeps using the separate `registration` database.

## Deliverables

- `problem2_DDL.sql` — creates the `library` database and its `author` and `book` tables. Deleting an author cascades to their books.
- `problem2_DML.sql` — inserts 3 authors and 6 books.
- `website/` — the Lab 2 Node.js/Express/EJS website with the Lab 3 Library pages and CRUD routes.

## Requirements covered

- Displays all books, including each book's `author_id`, and all authors.
- Adds and edits books and authors.
- Removes books and authors. Author deletion uses the database's `ON DELETE CASCADE` rule to remove that author's books.
- Uploads optional JPEG, PNG, or WebP cover images and author photos (maximum 5 MB each). Replacing or deleting a record also cleans up its uploaded image.
- Uses parameterized SQL and server-side input validation.

## Run the database scripts

Install MySQL 8 and open PowerShell in this folder. Create the schema, then load the sample records:

```powershell
Get-Content .\problem2_DDL.sql | mysql -u root -p
Get-Content .\problem2_DML.sql | mysql -u root -p
```

The DDL drops and recreates only the `library` database. Do not run it if you need to preserve existing data in a database with that name.

The DDL includes the nullable image columns used for uploads. If you already created the earlier Lab 3 schema, rerun the DDL and then reload the seed data before starting the updated website.

## Configure and run the website

1. Install Node.js 18 or newer and ensure the MySQL server is running.
2. Open a terminal in `website/` and install the project dependencies:

   ```sh
   npm install
   ```

3. Copy `.env.example` to `.env` and set your MySQL credentials:

   ```powershell
   Copy-Item .env.example .env
   ```

   For example, configure:

   ```env
   PORT=3000
   SESSION_SECRET=replace_with_a_long_random_secret
   DB_HOST=localhost
   DB_PORT=3306
   DB_USER=root
   DB_PASSWORD=your_mysql_password
   DB_NAME=registration
   LIBRARY_DB_NAME=library
   ```

   `DB_NAME` is used by the existing Lab 2 study planner. The new Library pages connect to `LIBRARY_DB_NAME`.

4. Start the server:

   ```sh
   npm start
   ```

5. Open `http://localhost:3000/library`. Use the **Library** link in the site header to return to this page from the existing Lab 2 site.

## Tests

From `website/`, run:

```sh
npm test
```
