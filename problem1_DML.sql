USE company;

-- 1. Insert initial employees (with Dno as NULL to resolve circular dependency)
INSERT INTO EMPLOYEE (ssn, fname, lname, bdate, address, gender, salary, Dno) VALUES
(101, 'Ahmed', 'Hassan', '1990-05-15', '123 Horreya Ave, Alexandria', 'M', 15000.00, NULL),
(102, 'Sara', 'Ibrahim', '1993-08-20', '45 Cornish St, Alexandria', 'F', 16500.00, NULL),
(103, 'Mohamed', 'Ali', '1988-11-03', '12 Stanley St, Alexandria', 'M', 14000.00, NULL);

-- 2. Insert departments referencing the managers
INSERT INTO DEPARTMENT (Dnumber, Dname, mgr_ssn, mgr_start_date) VALUES
(1, 'Research & Development', 101, '2020-01-01'),
(2, 'Administration', 102, '2021-03-15'),
(3, 'Information Technology', 103, '2019-06-01');

-- 3. Update employees with their assigned department numbers
UPDATE EMPLOYEE SET Dno = 1 WHERE ssn = 101;
UPDATE EMPLOYEE SET Dno = 2 WHERE ssn = 102;
UPDATE EMPLOYEE SET Dno = 3 WHERE ssn = 103;

-- 4. Insert projects referencing departments
INSERT INTO PROJECT (Pnumber, Pname, Plocation, Dno) VALUES
(10, 'AlphaAI', 'Alexandria', 1),
(20, 'InternalPortal', 'Cairo', 2),
(30, 'CloudMigration', 'Alexandria', 3);
