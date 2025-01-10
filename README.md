# typescriptUserAuthentication
# TypeNode Project

This is a Node.js project using TypeScript, Express, MongoDB, and other modern web development technologies. The project includes user authentication, profile management, and image upload functionalities.

## Table of Contents

- [Installation](#installation)
- [Configuration](#configuration)
- [Usage](#usage)
- [API Endpoints](#api-endpoints)
- [License](#license)

## Installation

1. Clone the repository:
    ```sh
    git clone https://github.com/yourusername/typenode.git
    cd typenode
    ```

2. Install dependencies:
    ```sh
    npm install
    ```

3. Create a `.env` file in the root directory and add the following environment variables:
    ```properties
    PORT=9000
    JWT_SECRET="#########"
    GMAIL_USER="#########"
    GMAIL_PASS="#########"
    CLOUDINARY_CLOUD_NAME="#########"
    CLOUDINARY_API_KEY="#########"
    CLOUDINARY_API_SECRET="#########"
    SESSION_SECRET="#########"
    ```

4. Start the server:
    ```sh
    npm run dev
    ```

## Configuration

Ensure you have MongoDB installed and running on your local machine or provide a MongoDB URI in the `.env` file:
```properties
MONGO_URI="your_mongodb_uri"
```

## Usage

The server will start on `http://localhost:9000`. You can use tools like Postman or cURL to interact with the API endpoints.

## API Endpoints

### Authentication

- **POST /auth/signup**: Register a new user.
- **POST /auth/resend-otp**: Resend OTP for email confirmation.
- **POST /auth/verify-otp**: Verify OTP for email confirmation.
- **POST /auth/login**: Login with email and password.
- **POST /auth/forgot**: Request password reset.
- **POST /auth/reset-password**: Reset password using token.

### Profile Management

- **POST /protected/completeProfile**: Complete user profile.
- **GET /protected/fetchProfile**: Fetch user profile.
- **POST /protected/editProfile**: Edit user profile.

### Image Upload

- **POST /upload-image**: Upload an image.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
