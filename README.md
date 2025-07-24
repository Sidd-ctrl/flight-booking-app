Flight Booking App

This is a basic Angular project I created to practice and understand core Angular concepts like routing, lazy loading, services, and form validation. It simulates a simple flight booking system where users can log in, browse available flights, and add them to a cart.

## Features

- Login page using reactive forms with validation
- Flight list (products) with dynamic routing to detail pages
- Route parameter handling using ActivatedRoute
- Cart page to simulate selected bookings
- Lazy-loaded modules for better performance
- Custom validator examples

## How to Run

Make sure Node.js and Angular CLI are installed.

Install Angular CLI globally:

npm install -g @angular/cli

Then follow these steps:

git clone https://github.com/your-username/flight-booking-app.git  
cd flight-booking-app  
npm install  
ng serve

Now, open your browser and go to http://localhost:4200

## Purpose of This Project

This project was made to understand:

- How Angular components and modules are structured
- Navigation and dynamic routing
- Form handling and validation
- Creating and injecting services
- Optimizing with lazy loading

## Folder Structure

flight-booking-app  
src  
└── app  
    ├── login  
    ├── products  
    ├── cart  
    ├── services  
    ├── validators  
    ├── app-routing.module.ts  
    └── app.module.ts  
assets  
index.html  
angular.json  
package.json  
README.md

## Contact

Feel free to reach out if you want to discuss or suggest improvements. Contributions are always welcome.
