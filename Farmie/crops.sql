CREATE TABLE Crop (
    crop_name VARCHAR(100) PRIMARY KEY,
    crop_family VARCHAR(100) NOT NULL,
    optimal_temp NUMERIC,      -- Average temperature in °C
    optimal_humidity NUMERIC,  -- Average humidity in %
    optimal_rainfall NUMERIC   -- Average annual rainfall in mm
);

INSERT INTO Crop (crop_name, crop_family, optimal_temp, optimal_humidity, optimal_rainfall) VALUES 
('aloevera', 'Asphodelaceae', 25, 45, 400),
('banana', 'Musaceae', 28, 75, 2250),
('bilimbi', 'Oxalidaceae', 29, 75, 1750),
('cantaloupe', 'Cucurbitaceae', 27, 65, 500),
('cassava', 'Euphorbiaceae', 27, 65, 1250),
('coconut', 'Arecaceae', 29, 75, 2000),
('corn', 'Poaceae', 25, 60, 800),
('cucumber', 'Cucurbitaceae', 24, 78, 500),
('curcuma', 'Zingiberaceae', 25, 80, 1500),
('eggplant', 'Solanaceae', 26, 65, 750),
('galangal', 'Zingiberaceae', 25, 75, 2250),
('ginger', 'Zingiberaceae', 25, 80, 2250),
('guava', 'Myrtaceae', 26, 65, 1500),
('kale', 'Brassicaceae', 20, 65, 500),
('longbeans', 'Fabaceae', 30, 60, 800),
('mango', 'Anacardiaceae', 27, 60, 1650),
('melon', 'Cucurbitaceae', 27, 65, 500),
('orange', 'Rutaceae', 25, 70, 1250),
('paddy', 'Poaceae', 29, 75, 1750),
('papaya', 'Caricaceae', 28, 75, 1750),
('peper chili', 'Solanaceae', 25, 60, 900),
('pineapple', 'Bromeliaceae', 25, 75, 1250),
('pomelo', 'Rutaceae', 29, 70, 1250),
('shallot', 'Amaryllidaceae', 20, 65, 650),
('soybeans', 'Fabaceae', 25, 65, 600),
('spinach', 'Amaranthaceae', 17, 65, 500),
('sweet potatoes', 'Convolvulaceae', 27, 65, 1000),
('tobacco', 'Solanaceae', 25, 75, 750),
('waterapple', 'Myrtaceae', 29, 75, 2000),
('watermelon', 'Cucurbitaceae', 26, 65, 500);