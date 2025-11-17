
# Admin Access Guide

## Overview

The admin login system has been upgraded to use **email-based One-Time Password (OTP) authentication** instead of a hardcoded password. This provides better security and resolves iOS AsyncStorage timing issues.

## How It Works

### 1. **Email-Based Authentication**
- Admin users are stored in the `admin_users` database table
- Only emails in this table can access admin features
- Authentication uses Supabase Auth with OTP (One-Time Password)

### 2. **Login Flow**
1. Admin enters their authorized email address
2. System checks if email is in `admin_users` table
3. If authorized, a 6-digit OTP is sent to the email
4. Admin enters the OTP to verify and login
5. Session is saved securely using AsyncStorage + Supabase Auth

### 3. **Security Features**
- ✅ No hardcoded passwords in the app
- ✅ OTP codes expire after 60 minutes
- ✅ Email verification required for each login
- ✅ Admin status can be revoked from database
- ✅ Session verification on dashboard access
- ✅ Secure logout clears both local and server sessions

## Managing Admin Users

### Adding a New Admin Email

You need to add admin emails directly to the database. Here are three ways to do this:

#### Option 1: Using Supabase Dashboard (Recommended)
1. Go to your Supabase project dashboard
2. Navigate to **Table Editor** → **admin_users**
3. Click **Insert row**
4. Enter the email address
5. Set `is_active` to `true`
6. Click **Save**

#### Option 2: Using SQL Editor
```sql
INSERT INTO admin_users (email, is_active)
VALUES ('newadmin@yourcompany.com', true);
```

#### Option 3: Using the App (Future Enhancement)
You can create an "Admin Manager" screen in the app that allows existing admins to add/remove other admins.

### Removing Admin Access

To revoke admin access without deleting the record:

```sql
UPDATE admin_users
SET is_active = false
WHERE email = 'admin@yourcompany.com';
```

To restore access:

```sql
UPDATE admin_users
SET is_active = true
WHERE email = 'admin@yourcompany.com';
```

### Viewing All Admin Users

```sql
SELECT * FROM admin_users ORDER BY created_at DESC;
```

## Default Admin Email

The system creates a default admin email during migration:
- **Email:** `admin@yourcompany.com`

**⚠️ IMPORTANT:** Change this to your actual admin email address!

```sql
-- Update the default admin email
UPDATE admin_users
SET email = 'youremail@yourdomain.com'
WHERE email = 'admin@yourcompany.com';
```

## Troubleshooting

### "This email is not authorized for admin access"
- The email is not in the `admin_users` table
- The email might be inactive (`is_active = false`)
- Check the database and add/activate the email

### "Failed to send OTP"
- Check your Supabase Auth settings
- Ensure email templates are configured
- Verify SMTP settings in Supabase dashboard

### "The code you entered is incorrect or has expired"
- OTP codes expire after 60 minutes
- Request a new code
- Check spam folder for the email

### Session Issues on iOS
- The new system uses Supabase Auth which is more reliable than AsyncStorage alone
- Sessions are verified against the database on each dashboard access
- If issues persist, try logging out and logging back in

## Benefits of New System

### Compared to Hardcoded Password:
1. **More Secure:** No password stored in app code
2. **Better iOS Compatibility:** Uses Supabase Auth instead of just AsyncStorage
3. **Revocable Access:** Can disable admin access from database
4. **Multiple Admins:** Support for multiple admin users
5. **Audit Trail:** Track when admins were added/removed
6. **Email Verification:** Ensures admin has access to the email account

### User Experience:
- Clean, modern login interface
- Clear feedback during authentication
- Countdown timer for OTP resend
- Ability to change email if mistyped
- Security badges showing verification status

## Future Enhancements

Consider adding these features:

1. **Admin Manager Screen**
   - View all admin users
   - Add/remove admin access
   - View login history

2. **Two-Factor Authentication**
   - Add SMS as backup OTP method
   - Support authenticator apps

3. **Session Management**
   - View active sessions
   - Remote logout capability
   - Session expiration settings

4. **Audit Logging**
   - Track admin actions
   - Login/logout history
   - Changes made by each admin

## Database Schema

```sql
CREATE TABLE admin_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

## Support

If you need help with admin access:
1. Check this guide first
2. Verify email is in `admin_users` table
3. Check Supabase Auth logs
4. Review app console logs for detailed error messages
