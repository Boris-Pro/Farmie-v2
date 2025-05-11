-- Create the database
CREATE DATABASE IF NOT EXISTS Farmie;

-- Use the database
USE Farmie;

-- Create User table
CREATE TABLE User (
    user_id INT PRIMARY KEY AUTO_INCREMENT,
    user_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL
);

-- Create Farm table
CREATE TABLE farm (
    farm_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT,
    farm_name VARCHAR(100),
    longitude DOUBLE,
    latitude DOUBLE,
    FOREIGN KEY (user_id) REFERENCES user(user_id)
);


-- Create Crop table
CREATE TABLE Crop (
    crop_name VARCHAR(100) PRIMARY KEY,
    crop_family VARCHAR(100) NOT NULL,
    optimal_temp NUMERIC,      -- Average temperature in °C
    optimal_humidity NUMERIC,  -- Average humidity in %
    optimal_rainfall NUMERIC   -- Average annual rainfall in mm
);

-- Create Cultivate table (linking crops and farms)
CREATE TABLE Cultivate (
    crop_name VARCHAR(100),
    farm_id INT,
    quantity INT NOT NULL,
    PRIMARY KEY (crop_name, farm_id),
    FOREIGN KEY (crop_name) REFERENCES Crop(crop_name) ON DELETE CASCADE,
    FOREIGN KEY (farm_id) REFERENCES Farm(farm_id) ON DELETE CASCADE
);
