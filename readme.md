# TourQuest

A dynamic website built with Pug templates, powered by a Node.js (Express.js) backend. It features user authorization, email notifications, user roles, a review system, and a booking system with Stripe payment integration.

## Installation

### Requirements

Requirements

Ensure you have the following installed and setup:

1. Node.js
2. MongoDB
3. Mailtrap account for development email testing.
4. Sendgrid account for production email services.
5. Stripe account for handling payments.

### Setup

1. Clone the following repository.

   ```sh
   git clone https://github.com/grahil-24/TourWebsite_NodeExp.JS.git
   ```

2. Create a Configuration File
Create a config.env file in the root directory and add the following environment variables:

   ```sh
   NODE_ENV=development
   PORT=3000
   DATABASE={mongodb connection string}
   DATABASE_LOCAL=mongodb://localhost:27017/database
   DATABASE_PASSWORD={database connection password}

   JWT_SECTET={Secret JWT private key}
   JWT_EXPIRES_IN=90d
   JWT_COOKIE_EXPIRES_IN=90

   STRIPE_SECRET_KEY={Stripe secret key}
   STRIPE_WEBHOOK_SECRET={Stripe secret key for webhooks}

   EMAIL_USERNAME={Mailtrap username}
   EMAIL_PASSWORD={Mailtrap password}
   EMAIL_HOST=smtp.mailtrap.io
   EMAIL_PORT=25

   EMAIL_FROM={Your email}

   SENDGRID_USERNAME=apikey
   SENDGRID_PASSWORD={Sendgrid password}


   ```

3. Install Dependencies
 
   Open the project directory in your terminal and run:
   ```sh
   npm install
   ```

4. Run the Development Server
   Start the development server with:

    ```sh
    npm run dev
    ```

5. Build Frontend JavaScript Bundles

   To compile the frontend JavaScript files, run one of the following commands:

   ```
    npm run watch:js
    OR
    npm run build:js
   ```

6. Access the Application

   Visit http://localhost:3000 in your web browser.

