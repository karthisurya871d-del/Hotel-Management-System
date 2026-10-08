# Hotel Management System

This is a full-stack Hotel Management web application developed using **React** for the frontend, **Node.js and Express.js** for the backend, and **PostgreSQL** for storing and managing hotel data.

The application allows users to view hotel details, search and filter hotels, add new hotels, edit existing information, upload images, and delete hotel listings.

---

##  Features

* **Hotel Listing:** View available hotels with search, price filtering, and pagination.
* **Hotel Details:** View complete information about a hotel, including its description, location, price, coordinates, and image.
* **Add Hotel:** Add a new hotel by entering its details and uploading an image.
* **Edit Hotel:** Update the details of an existing hotel and change its image if required.
* **Delete Hotel:** Delete a hotel from the system.
* **Image Upload:** Supports JPEG, JPG, PNG, and WEBP image formats.
* **Backend Image Serving:** Uploaded images can be accessed directly through the backend server.

---

##  Technologies Used

### Frontend

* React 19
* Vite
* React Router DOM
* CSS

### Backend

* Node.js
* Express.js
* PostgreSQL
* pg (PostgreSQL package for Node.js)
* Multer for image uploads
* CORS
* dotenv
* Nodemon

---

## Project Structure

```text
Surya Project/
│
├── hotel-management-backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── db.js
│   │   ├── controllers/
│   │   │   └── hotelController.js
│   │   ├── routes/
│   │   │   └── hotelRoutes.js
│   │   ├── middleware/
│   │   ├── uploads/
│   │   ├── app.js
│   │   └── server.js
│   │
│   ├── createTable.js
│   ├── .env
│   └── package.json
│
└── hotel-management-frontend/
    ├── src/
    │   ├── api/
    │   │   └── hotels.js
    │   ├── components/
    │   │   └── Pagination.jsx
    │   ├── pages/
    │   │   ├── HotelList.jsx
    │   │   ├── HotelDetail.jsx
    │   │   ├── AddHotel.jsx
    │   │   └── EditHotel.jsx
    │   ├── App.jsx
    │   ├── main.jsx
    │   └── index.css
    │
    ├── index.html
    ├── vite.config.js
    └── package.json
```

---

## Requirements

Before running the project, make sure these are installed on your system:

* **Node.js** (version 18 or above)
* **npm**
* **PostgreSQL**

---

##  Database Setup

First, create a PostgreSQL database named `hotel_db`.

You can create it using **pgAdmin** or the PostgreSQL terminal:

```sql
CREATE DATABASE hotel_db;
```

After creating the database, update the database details in the `.env` file.

Then go to the backend folder and run the table creation script:

```bash
cd hotel-management-backend
node createTable.js
```

This will create the required hotel table in the database.

---

## Environment Variables

Create a `.env` file inside the `hotel-management-backend` folder and add your PostgreSQL details:

```env
PORT=3000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=hotel_db
DB_USER=your_postgres_username
DB_PASSWORD=your_postgres_password
```

Replace the username and password with your own PostgreSQL credentials.

---

## How to Run the Project

### 1. Start the Backend

Open the terminal and move to the backend folder:

```bash
cd hotel-management-backend
```

Install the required packages:

```bash
npm install
```

Start the backend server:

```bash
npm run dev
```

The backend will run on:

```text
http://localhost:3000
```

---

### 2. Start the Frontend

Open another terminal and go to the frontend folder:

```bash
cd hotel-management-frontend
```

Install the frontend packages:

```bash
npm install
```

Start the React development server:

```bash
npm run dev
```

The frontend will normally be available at:

```text
http://localhost:5173
```

---

##  API Endpoints

The backend provides the following REST API endpoints:

| Method | Endpoint          | Purpose                         |
| ------ | ----------------- | ------------------------------- |
| GET    | `/api/hotels`     | Get the list of hotels          |
| GET    | `/api/hotels/:id` | Get details of a specific hotel |
| POST   | `/api/hotels`     | Add a new hotel                 |
| PUT    | `/api/hotels/:id` | Update an existing hotel        |
| DELETE | `/api/hotels/:id` | Delete a hotel                  |

### GET `/api/hotels`

Supports the following query parameters:

```text
search
minPrice
maxPrice
page
limit
```

These parameters are used for searching, filtering, and pagination.

### POST `/api/hotels`

New hotel details are sent using **Form-Data**.

The fields include:

```text
title
description
price
latitude
longitude
image
```

The same fields can be used when updating a hotel using the PUT request.

---

## How the Application Works

The frontend is built with React and communicates with the backend through REST APIs.

When a user searches for hotels or performs an action such as adding, editing, or deleting a hotel, the React frontend sends a request to the Express backend.

The backend processes the request and communicates with PostgreSQL to store or retrieve the required information.

For hotel images, **Multer** is used to handle the file upload. The uploaded images are stored in the backend's `uploads` folder and are served through the Express server.

So the basic flow is:

```text
React Frontend
      ↓
Express / Node.js Backend
      ↓
PostgreSQL Database
```

For image uploads:

```text
React
  ↓
Multer
  ↓
uploads folder
  ↓
Express Static File Serving
```

---

##  Author

**Surya**

A full-stack project created as part of my web development learning and project work.
