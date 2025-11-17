
# Admin Access Guide

## Overview
This application uses a simple password-based authentication system for admin access. Admin users are managed through two Supabase tables: `admin_users` and `admin_passwords`.

## Current Admin Users
- **Email:** agoins@refreshductcleaning.com
- **Default Password:** admin123

⚠️ **IMPORTANT:** Change the default password immediately after first login using the "Change Password" option in the admin dashboard.

## How Admin Login Works

### Authentication Flow
1. User enters email and password on the Admin Login screen
2. System checks if email exists in `admin_users` table and is active
3. System verifies password against `admin_passwords` table
4. If both checks pass, a session is created in AsyncStorage
5. User is redirected to the Admin Dashboard

### Database Tables

#### admin_users
Stores authorized admin email addresses:
- `id` (uuid): Primary key
- `email` (text): Admin email address (unique)
- `is_active` (boolean): Whether the admin account is active
- `created_at` (timestamp): When the admin was added
- `updated_at` (timestamp): Last update time

#### admin_passwords
Stores admin passwords:
- `id` (uuid): Primary key
- `email` (text): Admin email address (unique, references admin_users)
- `password_hash` (text): Plain text password (for simplicity)
- `is_active` (boolean): Whether the password is active
- `created_at` (timestamp): When the password was set
- `updated_at` (timestamp): Last password change time

### Row Level Security (RLS)
Both tables have RLS enabled:
- **admin_users**: Anyone can SELECT to check if they are an admin
- **admin_passwords**: Anyone can SELECT for password verification (read-only from client)

## Admin Features

### Admin Dashboard
Access to:
- Price Editor: Edit pricing for all services
- Services Editor: Manage available services
- Company Editor: Manage company list
- Zipcode Editor: Manage zipcode charges
- Zipcode Analyzer: Analyze zipcode data
- Password Change: Update admin password

### Changing Admin Password
1. Log in to the Admin Dashboard
2. Click "Change Password"
3. Enter current password
4. Enter new password (minimum 6 characters)
5. Confirm new password
6. Click "Update Password"

## Adding New Admin Users

To add a new admin user, you need to:

1. Add the email to the `admin_users` table:
```sql
INSERT INTO admin_users (email) 
VALUES ('newemail@example.com');
```

2. Set a password in the `admin_passwords` table:
```sql
INSERT INTO admin_passwords (email, password_hash) 
VALUES ('newemail@example.com', 'temporary_password_123');
```

3. Notify the new admin to change their password after first login.

## Removing Admin Access

To deactivate an admin user:
```sql
UPDATE admin_users 
SET is_active = false 
WHERE email = 'admin@example.com';
```

To reactivate:
```sql
UPDATE admin_users 
SET is_active = true 
WHERE email = 'admin@example.com';
```

## Security Notes

1. **Password Storage**: Currently using plain text passwords for simplicity. In a production environment, you should use proper password hashing (bcrypt, argon2, etc.).

2. **Session Management**: Sessions are stored in AsyncStorage on the device. Clearing app data will log out the admin.

3. **No Password Recovery**: There is no automated password recovery system. If an admin forgets their password, it must be reset manually in the database.

4. **RLS Policies**: The tables are protected by Row Level Security, but passwords are readable for verification purposes. Consider implementing server-side authentication for enhanced security.

## Troubleshooting

### Login Not Working
1. **Check email spelling**: Ensure the email is exactly as stored in the database (case-sensitive)
2. **Verify password**: Default password is "admin123"
3. **Check is_active status**: Ensure both admin_users and admin_passwords have is_active = true
4. **Check RLS policies**: Ensure the "Allow password verification" policy exists on admin_passwords table
5. **Clear app cache**: Try clearing AsyncStorage and restarting the app

### Common Issues Fixed
- **406 Error on Login**: This was caused by an overly restrictive RLS policy on the admin_passwords table. The policy has been updated to allow SELECT operations for password verification.

### Database Queries for Debugging

Check if admin exists:
```sql
SELECT * FROM admin_users WHERE email = 'agoins@refreshductcleaning.com';
```

Check password:
```sql
SELECT email, is_active FROM admin_passwords WHERE email = 'agoins@refreshductcleaning.com';
```

Check RLS policies:
```sql
SELECT * FROM pg_policies WHERE tablename IN ('admin_users', 'admin_passwords');
```

## Future Improvements

Consider implementing:
1. Proper password hashing (bcrypt)
2. Password complexity requirements
3. Failed login attempt tracking
4. Session expiration
5. Two-factor authentication
6. Password recovery via email
7. Audit logging for admin actions
