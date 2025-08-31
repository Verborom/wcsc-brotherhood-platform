# 🚀 SUPABASE SETUP GUIDE - Step by Step

## Step 1: Create Supabase Account (5 minutes)

1. **Go to Supabase**: Visit [supabase.com](https://supabase.com)
2. **Sign Up**: Use your GitHub account or email
3. **Create New Project**: 
   - Project Name: `WCSC Brotherhood Platform`
   - Database Password: Create a strong password (save this!)
   - Region: Choose closest to your users (US West for Texas)

## Step 2: Deploy Database Schema (10 minutes)

1. **Open SQL Editor**: In your Supabase dashboard, click "SQL Editor"
2. **Create New Query**: Click "+ New query"
3. **Copy & Paste**: Copy the entire contents from `backend/database/schema.sql`
4. **Run Query**: Click "Run" button
5. **Verify**: Check "Table Editor" - you should see 8 tables created

## Step 3: Get Your Credentials (2 minutes)

1. **Go to Settings**: Click gear icon → "API"
2. **Copy Two Items**:
   - **Project URL**: `https://your-project-ref.supabase.co`
   - **Anon Key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (long string)

## Step 4: Update Configuration (5 minutes)

1. **Open**: `backend/config/supabase.js` in your repository
2. **Replace**: The placeholder values with your real credentials:

```javascript
// Replace these with your actual Supabase credentials
const SUPABASE_URL = 'https://your-project-ref.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';
```

3. **Commit**: Push the changes to your repository

## Step 5: Configure Authentication (5 minutes)

1. **Go to Authentication**: In Supabase dashboard → "Authentication"
2. **URL Configuration**: Go to "URL Configuration"
3. **Set Site URL**: `https://verborom.github.io`
4. **Add Redirect URLs**: Add these URLs:
   ```
   https://verborom.github.io/wcsc-brotherhood-platform/calendar.html
   https://verborom.github.io/wcsc-brotherhood-platform/archives.html
   https://verborom.github.io/wcsc-brotherhood-platform/scripture.html
   https://verborom.github.io/wcsc-brotherhood-platform/index.html
   ```

## Step 6: Enable Email (5 minutes)

1. **Go to Authentication**: → "Settings"
2. **Enable Email Confirmation**: Toggle ON
3. **Email Templates**: Customize welcome email (optional)

## Step 7: Test Everything (10 minutes)

1. **Visit Your Site**: `https://verborom.github.io/wcsc-brotherhood-platform`
2. **Register Account**: Try creating a new account
3. **Check Email**: Confirm account via email
4. **Login**: Test login functionality
5. **Test Pages**: Visit calendar, archives, scripture pages

## Step 8: Create Admin Account (5 minutes)

1. **Register**: Create your admin account through the website
2. **Promote to Admin**: 
   - Go to Supabase → "Table Editor" → "users" table
   - Find your user record
   - Change "role" from "member" to "admin"
   - Save changes
3. **Test Admin Functions**: You should now see "Add Event" and other admin buttons

## 🆘 Troubleshooting

**Problem: "supabaseClient is not defined"**
- **Solution**: Make sure you updated `backend/config/supabase.js` with your credentials

**Problem: "Invalid API key"**  
- **Solution**: Double-check you copied the ANON key (not service role key)

**Problem: "Failed to create user profile"**
- **Solution**: Make sure you ran the SQL schema completely

**Problem: Email confirmation not working**
- **Solution**: Check spam folder, verify email settings in Supabase

## 📞 Need Help?

If you get stuck, share:
1. Your Supabase project URL (safe to share)
2. Any error messages you see
3. Which step you're stuck on

The setup should take about 30-45 minutes total.
