# EduStudy Website — Lab 2 and Lab 3 Library

The application uses Node.js, Express, EJS, and MySQL. The original Lab 2 registration/study planner continues to use the `registration` database. Lab 3 Library routes use the separate database configured by `LIBRARY_DB_NAME`.

Book covers and author photos are optional. Uploads are limited to JPEG, PNG, or WebP images up to 5 MB and are stored under `public/uploads/library/`. The upload directory is ignored by Git; it is created automatically when the first image is uploaded.

## Setup

1. Install Node.js 18 or newer and MySQL 8.
2. Install dependencies:

   ```sh
   npm install
   ```

3. Create the Lab 2 database if you plan to use registration and study tasks. In PowerShell, run:

   ```powershell
   Get-Content .\database\schema.sql | mysql -u root -p
   ```

4. Create and seed the Lab 3 Library database by running the SQL files in the parent folder:

   ```powershell
   Get-Content ..\problem2_DDL.sql | mysql -u root -p
   Get-Content ..\problem2_DML.sql | mysql -u root -p
   ```

5. Copy `.env.example` to `.env` with `Copy-Item .env.example .env`, then configure `DB_HOST`, `DB_PORT`, `DB_USER`, and `DB_PASSWORD`. Keep `DB_NAME=registration` and `LIBRARY_DB_NAME=library`, unless you used different database names.
6. Start the server:

   ```sh
   npm start
   ```

7. Browse to `http://localhost:3000/library` for the Library, or `http://localhost:3000/login` for the existing Lab 2 study planner.

Run `npm test` to execute the existing application tests.
