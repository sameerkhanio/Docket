# Docket

A serverless document management app built on AWS. Users sign up, log in, and manage their own documents through a JWT-secured REST API. There are no servers to provision or patch, and it scales on demand.

**Live demo:** https://d3164abu70erxh.cloudfront.net

## Screenshots

| Login / Signup | Documents | Create Document |
|---|---|---|
| ![Login](screenshots/docketlogin.png) | ![Documents](screenshots/filledfiledocket.png) | ![Create Document](screenshots/writedocdocket.png) |

More screenshots of the AWS services (S3, CloudFront, API Gateway, Lambda, DynamoDB) are available in the `screenshots` folder.

## Overview

Docket is the serverless project in my AWS portfolio. It is a counterpart to my server-based Task Manager project, built to show how the same kind of problem (authenticated users managing their own data) can be solved with a fully managed, event-driven architecture.

**What it does**

- User registration and login
- Stateless authentication with JSON Web Tokens (JWT)
- Full CRUD for documents (create, read, update, delete)
- Every protected route is verified by a dedicated Lambda authorizer
- Per-user data, split across two DynamoDB tables
- Static frontend hosted in a private S3 bucket and delivered through CloudFront over HTTPS

## Architecture

![Architecture](screenshots/docket-architecture.png)

**Request flow**

1. The user signs up. The frontend then logs the user in automatically to obtain a JWT. Signup and login are public routes.
2. On a successful login, the API returns a signed JWT.
3. The frontend sends the token with every document request.
4. API Gateway calls `DocketJWTAuthorizer` first. Invalid or missing tokens are rejected before any business logic runs.
5. If the token is valid, the matching Lambda reads or writes the `docs` table.

## AWS Services

| Service | Role |
|---|---|
| S3 | Hosts the static frontend (private bucket, accessible only through CloudFront) |
| CloudFront | Serves the frontend over HTTPS using Origin Access Control (OAC) |
| API Gateway | REST API with 6 methods, single entry point for the frontend |
| Lambda | 7 functions (Python 3.12) containing all backend logic |
| DynamoDB | Two tables: `users` and `docs` |
| IAM | Least-privilege execution roles for each function |
| CloudWatch | Logs and debugging for Lambda and API Gateway |

## Lambda Functions

| Function | Purpose | Auth required |
|---|---|---|
| `UserSignup` | Creates a new user in the users table | No |
| `UserLogin` | Verifies credentials and issues a JWT | No |
| `CreateFiles` | Creates a new document | Yes |
| `GetFiles` | Retrieves the user's document(s) | Yes |
| `UpdateFiles` | Updates an existing document | Yes |
| `DeleteFiles` | Deletes a document | Yes |
| `DocketJWTAuthorizer` | Validates the JWT and authorizes each protected request | n/a |

## API Endpoints

Stage: `dev`

| Method | Route | Lambda | Auth |
|---|---|---|---|
| POST | `/signup` | `UserSignup` | No |
| POST | `/login` | `UserLogin` | No |
| POST | `/create-file` | `CreateFiles` | Yes |
| GET | `/get-files` | `GetFiles` | Yes |
| PUT | `/update-files` | `UpdateFiles` | Yes |
| DELETE | `/delete-files` | `DeleteFiles` | Yes |

Protected routes expect the header:

```
Authorization: Bearer <jwt-token>
```

**Example: login**

```
POST /login
Content-Type: application/json

{
  "Email": "user@example.com",
  "password": "your-password"
}
```

```json
{
  "token": "<jwt-token>",
  "name": "User Name"
}
```

## Data Model

**`users` table**

| Attribute | Type | Notes |
|---|---|---|
| `Email` | String | Partition key, unique identifier of the user |
| `name` | String | User's display name (shown on the welcome screen) |
| `passwordHash` | String | Hashed password, plain-text passwords are never stored |

**`docs` table**

| Attribute | Type | Notes |
|---|---|---|
| `Email` | String | Partition key, owner of the document |
| `id` | String | Sort key, unique document ID |
| `content` | String | Document body |
| `createdAt` | String | Creation timestamp |
| `updatedAt` | String | Last modified timestamp |
| `UserName` | String | Owner's name, stored with the document |

## Frontend

The static frontend (HTML, CSS, JavaScript) is hosted in a private S3 bucket and delivered through CloudFront with Origin Access Control, so the bucket itself is never public. It is gated behind authentication:

- The service is locked behind a single entry button.
- Clicking it opens a signup / login form.
- After signup, the app logs the user in automatically and stores the JWT.
- A welcome screen greets the user by name.
- The document service then unlocks.

Stack: HTML, CSS, JavaScript

## Getting Started

### Prerequisites

- An AWS account
- AWS CLI configured (`aws configure`)
- Python 3.12 (Lambda runtime)

### Deployment

1. Create the DynamoDB tables: `users` and `docs`.
2. Create the 7 Lambda functions (Python 3.12) and attach an IAM role with access to the required tables and CloudWatch Logs.
3. Set environment variables on the Lambdas (see below).
4. Create the API Gateway REST API, add the 6 methods, and integrate each with its Lambda.
5. Attach `DocketJWTAuthorizer` as a Lambda authorizer on the protected methods.
6. Enable CORS on the API routes, then deploy the API to a stage (`dev`) and copy the invoke URL.
7. Set the API URL in the frontend config.
8. Create a private S3 bucket and upload the frontend files (`index.html` at the bucket root).
9. Create a CloudFront distribution with the S3 bucket as origin using Origin Access Control (OAC), set `index.html` as the default root object, and apply the bucket policy CloudFront generates.
10. Open the CloudFront URL. After updating frontend files, create an invalidation (`/*`) so CloudFront serves the latest version.

### Environment Variables

| Variable | Used by | Description |
|---|---|---|
| `JWT_SECRET` | `UserLogin`, `DocketJWTAuthorizer` | Secret used to sign and verify tokens |
| `USERS_TABLE` | `UserSignup`, `UserLogin` | Name of the users table |
| `DOCS_TABLE` | File functions | Name of the docs table |

Never commit secrets to the repository.

## Security

- Stateless JWT authentication, verified centrally by a Lambda authorizer
- Protected routes are rejected at the API Gateway layer before reaching business logic
- The user's identity comes from the verified token, not from client-supplied input
- Passwords are stored as hashes, never in plain text
- IAM roles scoped per function
- Frontend bucket is private and reachable only through CloudFront (OAC), served over HTTPS

## Related Projects

More projects from my AWS portfolio:

- **Task Manager:** Django app on VPC + EC2 + Auto Scaling + ALB + RDS (traditional server-based architecture)
- **Docket (this project):** fully serverless architecture
- **Thumbly:** serverless image processing pipeline with S3 events/static-site, Lambda, Pillow, CloudFront (SSL) + Route 53 custom domain

## Author

**Muhammad Sameer Khan**
BS Cloud Computing & Information Science, SSUET, Karachi

GitHub: https://github.com/sameerkhanio | LinkedIn: https://www.linkedin.com/in/sameerkhanio/