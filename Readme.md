# Backend Environment Variables

Create a file named `.env` in the root directory of your backend project and add the following configuration.

```env
# Server Configuration
PORT=8000

# Database Configuration
DB_USER=postgres
DB_PASSWORD=itsmeakash
DB_NAME=crm_db
DB_HOST=localhost
DB_PORT=5432
DATABASE_URL=

# JWT & Bcrypt Configuration
BCRYPT_SALT_ROUNDS=10
JWT_SECRET=itsmeakashse
JWT_EXPIRES_IN=7d
COOKIE_EXPIRES_DAYS=7

# CORS Configuration
CORS_ORIGIN=http://localhost:3000

# Environment
NODE_ENV=development
```

## Environment Variables

| Variable              | Description                           | Example                                          |
| --------------------- | ------------------------------------- | ------------------------------------------------ |
| `PORT`                | Backend server port                   | `8000`                                           |
| `DB_USER`             | PostgreSQL username                   | `postgres`                                       |
| `DB_PASSWORD`         | PostgreSQL password                   | `your_password`                                  |
| `DB_NAME`             | Database name                         | `crm_db`                                         |
| `DB_HOST`             | Database host                         | `localhost`                                      |
| `DB_PORT`             | PostgreSQL port                       | `5432`                                           |
| `DATABASE_URL`        | Optional PostgreSQL connection string | *(leave empty if using individual DB variables)* |
| `BCRYPT_SALT_ROUNDS`  | Password hashing strength             | `10`                                             |
| `JWT_SECRET`          | Secret key used to sign JWT tokens    | `your_secret_key`                                |
| `JWT_EXPIRES_IN`      | JWT token expiration time             | `7d`                                             |
| `COOKIE_EXPIRES_DAYS` | Authentication cookie expiration      | `7`                                              |
| `CORS_ORIGIN`         | Allowed frontend origin               | `http://localhost:3000`                          |
| `NODE_ENV`            | Application environment               | `development`                                    |

## Notes

* Never commit the `.env` file to version control.
* Add `.env` to your `.gitignore`.
* Use a strong, randomly generated value for `JWT_SECRET` in production.
* Update `CORS_ORIGIN` to your production frontend URL before deployment.
* In production, use secure database credentials and environment-specific values.
