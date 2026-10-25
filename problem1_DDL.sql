DROP DATABASE IF EXISTS company;
CREATE DATABASE company;
USE company;

CREATE TABLE EMPLOYEE (
    ssn INT NOT NULL,
    fname VARCHAR(50) NOT NULL,
    lname VARCHAR(50) NOT NULL,
    bdate DATE,
    address VARCHAR(100),
    gender CHAR(1),
    salary DECIMAL(10, 2),
    Dno INT,
    PRIMARY KEY (ssn)
);

CREATE TABLE DEPARTMENT (
    Dnumber INT NOT NULL,
    Dname VARCHAR(50) NOT NULL,
    mgr_ssn INT,
    mgr_start_date DATE,
    PRIMARY KEY (Dnumber),
    FOREIGN KEY (mgr_ssn) REFERENCES EMPLOYEE(ssn)
);

CREATE TABLE PROJECT (
    Pnumber INT NOT NULL,
    Pname VARCHAR(50) NOT NULL,
    Plocation VARCHAR(50),
    Dno INT,
    PRIMARY KEY (Pnumber),
    FOREIGN KEY (Dno) REFERENCES DEPARTMENT(Dnumber)
);

ALTER TABLE EMPLOYEE
    ADD FOREIGN KEY (Dno) REFERENCES DEPARTMENT(Dnumber);
