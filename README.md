# Database Lab 3: Foreign Keys and Simple SQL

**Student:** Ahmed Hatem  
**Student ID:** 2304158  
**Student:** yousef Amr
**Student ID:** 2304193

**Course:** Introduction to Database Systems — Alexandria National University, Faculty of Engineering  

---

## Deliverables in this repository

As specified in the lab assignment sheet, all deliverables are located in the repository folder:

- `problem1_DDL.sql` — DDL scripts creating the `company` database and tables (`EMPLOYEE`, `DEPARTMENT`, `PROJECT`) with primary and foreign keys.
- `problem1_DML.sql` — INSERT statements inserting at least 3 records in each table.
- `problem1_Answers.txt` — SQL queries, execution output/errors, and explanations for questions Q1.1, Q1.2, and Q1.3.
- `problem2_DDL.sql` — DDL scripts creating the `library` database and tables (`author`, `book`) with foreign keys and `ON DELETE CASCADE`.
- `problem2_DML.sql` — Seed data (INSERT) for testing: 3 authors and 6 books.
- `website/` — The extended Lab 2 Node.js/Express/EJS website with the Lab 3 Library pages and CRUD routes.
- `README.md` — Step-by-step instructions on running and testing all scripts and the web application.

---

## Part I: Problem 1 — The COMPANY Database

### 1. Run the Database Scripts (Problem 1)

Open PowerShell or your command prompt in this directory and execute:

```powershell
# 1. Build the company database and tables
Get-Content .\problem1_DDL.sql | mysql -u root -p

# 2. Insert records into EMPLOYEE, DEPARTMENT, and PROJECT
Get-Content .\problem1_DML.sql | mysql -u root -p
```

Or directly via MySQL CLI:
```sh
mysql -u root -p < problem1_DDL.sql
mysql -u root -p < problem1_DML.sql
```

### 2. Verify Problem 1 Answers

Refer to `problem1_Answers.txt` for:
- **Q1.1:** Deleting a referenced EMPLOYEE row referenced by DEPARTMENT (demonstrating referential integrity restriction).
- **Q1.2:** Inserting a PROJECT referencing a non-existent DEPARTMENT (demonstrating foreign key violation).
- **Q1.3:** Handling initial insertions when `mgr_ssn` and `Dno` are both `NOT NULL` (circular foreign keys).

---

## Part II: Problem 2 — Library (Books and Authors)

### 1. Run the Database Scripts (Problem 2)

```powershell
# 1. Build the library database and tables
Get-Content .\problem2_DDL.sql | mysql -u root -p

# 2. Insert seed authors and books
Get-Content .\problem2_DML.sql | mysql -u root -p
```

Or directly via MySQL CLI:
```sh
mysql -u root -p < problem2_DDL.sql
mysql -u root -p < problem2_DML.sql
```

### 2. Configure and Run the Website

1. Install Node.js 18 or newer and make sure your MySQL server is running.
2. Navigate into the `website/` directory and install dependencies:

   ```sh
   cd website
   npm install
   ```

3. Configure your environment variables:
   Copy `.env.example` to `.env` and fill in your MySQL credentials:

   ```powershell
   Copy-Item .env.example .env
   ```

   Example `.env`:
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

4. Start the server:

   ```sh
   npm start
   ```

5. Open your browser at:
   - `http://localhost:3000/library` — Access the Library system directly.
   - Use the **Library** link in the navigation header to switch between the Study Planner and the Library system.

---

## Running the Automated Test Suite

From the `website/` directory, run:

```sh
npm test
```

This executes 19 automated unit and integration tests covering:
- Password hashing (bcrypt) and authentication
- Input validation for registration, login, and tasks
- Library tables rendering (books with `author_id`, authors)
- Book CRUD (Add, Edit, Delete)
- Author CRUD (Add, Edit, Delete with cascade book deletion)
- Image uploads (validation of mime types and magic bytes, cover image, photo image, and file cleanup)
