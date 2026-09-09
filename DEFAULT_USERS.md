# Default Test Users - LearnTogether

This file documents the default test users created by `npm run setup-users`.

## Default Test Accounts

| Username | Email | Password | Role | Notes |
|---|---|---|---|---|
| `Yash-777` | yash.777@learntogether.dev | `[RANDOM]` | admin | Primary admin account. Password is randomly generated during setup. |
| `Yash-Admin` | yash.admin@learntogether.dev | `Admin` | admin | Secondary admin account for testing admin features. |
| `Yash-Editor` | yash.editor@learntogether.dev | `Editor` | editor | Editor account for testing content submission & draft workflows. |
| `Yash-Viewer` | yash.viewer@learntogether.dev | `Viewer` | viewer | Viewer account for testing read-only permissions. |

## How to create these users

1. Make sure Firebase is configured (see README.md "Setting up Firebase")
2. Set the `GOOGLE_APPLICATION_CREDENTIALS` environment variable:
   ```powershell
   $env:GOOGLE_APPLICATION_CREDENTIALS="./server/serviceAccountKey.json"
   ```
3. Run the setup script:
   ```bash
   npm run setup-users
   ```
4. The script will create the users and display the randomly-generated password for `Yash-777`

## Important Notes

- **Save the Yash-777 password**: When you run `npm run setup-users`, it will display the random password for the `Yash-777` account. Copy it somewhere safe - you'll need it to sign in to that account.
- **Idempotent**: If you run the script again, it will skip any users that already exist and only create new ones.
- **Email-based**: Users are created with these specific email addresses. Make sure these emails don't conflict with any real users.
- **Local development only**: These hardcoded passwords are for development convenience. **Before deploying to production, use a proper secrets management system** (environment variables, AWS Secrets Manager, etc.).

## Role Permissions

See README.md "Roles" section for details on what each role can do:

- **viewer**: Can view all topics (public + restricted)
- **editor**: Can view all topics + create drafts (pending admin review)
- **admin**: Full access - view all topics, create drafts, publish, manage users

## Testing User Access

- Use `Yash-Viewer` to test the basic viewer experience
- Use `Yash-Editor` to test the draft submission flow
- Use `Yash-Admin` or `Yash-777` to test admin features like publishing and user management

## Troubleshooting

**Users already exist**: If you run the setup script multiple times, existing users will be skipped (emails must be unique in Firebase).

**GOOGLE_APPLICATION_CREDENTIALS not set**: Make sure you've downloaded the service account key from Firebase Console and set the environment variable before running the script.

**Email already exists error**: Each user has a unique email. If you get this error, the user was already created in a previous setup run.
