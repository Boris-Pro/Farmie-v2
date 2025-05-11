







CREATE TABLE Farms (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  location VARCHAR(255) NOT NULL,
  crop VARCHAR(100) NOT NULL,
  image_url TEXT, -- stores the path or URL to the image
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
