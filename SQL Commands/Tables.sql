CREATE TABLE Cars(
    CarID INT PRIMARY KEY,
    Model VARCHAR(255) NOT NULL,
    ManufacturingYear INT NOT NULL,
    BookedBy VARCHAR(255) NOT NULL,
    CentreCity VARCHAR(255) NOT NULL,
    PricePerHour DECIMAL(10, 2) NOT NULL,
    BookedTimes INT NOT NULL
);

CREATE TABLE CitiesCentres(
    CentreID INT PRIMARY KEY,
    CityName VARCHAR(255) NOT NULL,
    Location VARCHAR(255) NOT NULL,
    CarID INT REFERENCES Cars(CarID),
    ImageLink VARCHAR(255) NOT NULL
);

CREATE TABLE Users(
    UserID INT PRIMARY KEY,
    Username VARCHAR(255) NOT NULL,
    Password VARCHAR(255) NOT NULL,
    ProfilePictureLink VARCHAR(255)
);

CREATE TABLE Payments(
    PaymentID INT PRIMARY KEY,
    UserID INT REFERENCES Users(UserID),
    CarID INT REFERENCES Cars(CarID),
    Amount DECIMAL(10, 2) NOT NULL,
    TimeOfPayment TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE Reviews(
    ReviewID INT PRIMARY KEY,
    UserID INT REFERENCES Users(UserID),
    Title VARCHAR(255) NOT NULL,
    Content TEXT NOT NULL,
    StarRatings INT NOT NULL
);

CREATE TABLE Gallery(
    GalleryID INT PRIMARY KEY,
    ImageLink VARCHAR(255) NOT NULL
);
