# WCSC Brotherhood Platform - Backend Setup Instructions

## 🎯 Overview

This guide will help you set up the complete backend infrastructure for the WCSC Brotherhood Platform using Supabase as the database and authentication provider.

## 📋 Prerequisites

- A Supabase account (free tier available)
- Basic understanding of SQL and JavaScript
- GitHub account (already have this)

## 🚀 Step 1: Create Supabase Project

1. **Sign up for Supabase**: Go to [supabase.com](https://supabase.com) and create an account
2. **Create New Project**:
   - Project Name: `wcsc-brotherhood-platform`
   - Database Password: Choose a strong password (save this!)
   - Region: Choose closest to your location
   - Pricing: Start with Free tier, upgrade to Pro (~$25/month) when ready for production

3. **Wait for Setup**: This takes 2-3 minutes

## 🗄️ Step 2: Set Up Database Schema

1. **Open SQL Editor** in your Supabase dashboard
2. **Run the Schema**: Copy and paste the entire contents of `backend/database/schema.sql`
3. **Execute**: Click "Run" to create all tables, functions, and policies
4. **Verify**: Check the "Table Editor" to see all tables were created

## 🔐 Step 3: Configure Authentication

1. **Authentication Settings**:
   - Go to Authentication > Settings
   - Enable email confirmations (recommended)
   - Set Site URL: `https://verborom.github.io/wcsc-brotherhood-platform`
   - Add Redirect URLs:
     - `https://verborom.github.io/wcsc-brotherhood-platform/calendar.html`
     - `http://localhost:8000` (for local development)

2. **Email Templates** (optional):
   - Customize confirmation and reset password emails
   - Add WCSC branding and messaging

## ⚙️ Step 4: Get API Credentials

1. **Go to Settings > API**
2. **Copy these values**:
   - Project URL (looks like: `https://your-project.supabase.co`)
   - Project API Key (anon/public key)

3. **Update Configuration**:
   - Open `backend/config/supabase.js`
   - Replace `YOUR_SUPABASE_URL_HERE` with your Project URL
   - Replace `YOUR_SUPABASE_ANON_KEY_HERE` with your API key

## 🌐 Step 5: Update Frontend Integration

Now we'll update the frontend to use the real Supabase backend instead of mock authentication.

### Update HTML Files to Include Supabase

Add this script tag to the `<head>` section of all HTML files:

```html
<script src="https://unpkg.com/@supabase/supabase-js@2"></script>
<script src="backend/config/supabase.js"></script>
```

### Files to Update:
- `index.html`
- `login.html`
- `calendar.html`
- `archives.html`
- `scripture.html`

## 📧 Step 6: Set Up Email Notifications

For the contact form to email joe.lafilm@gmail.com:

1. **Create Edge Function** (in Supabase):
   - Go to Database > Functions
   - Create new function: `send_contact_email`
   - Use the provided email function code

2. **Configure SMTP** (optional, for custom emails):
   - Use services like SendGrid, Mailgun, or AWS SES
   - Add credentials to Supabase secrets

## 🎨 Step 7: Add Sample Data (Optional)

1. **Create Test Users**:
   - Go to Authentication > Users
   - Add test members and leaders
   - Or use the registration system once it's live

2. **Add Sample Events and Content**:
   - Use the Table Editor to add sample calendar events
   - Add meeting archives for testing search functionality

## 🔧 Step 8: Environment Configuration

### For Development:
```bash
# Serve locally
python -m http.server 8000
# or
npx serve .
```

### For Production:
- GitHub Pages will automatically serve the updated files
- Supabase handles all backend operations
- No additional hosting costs for the frontend

## 💰 Pricing Breakdown

### Free Tier (Development/Small Scale):
- Up to 50,000 monthly active users
- 500MB database
- 1GB file storage
- 2GB bandwidth

### Pro Tier ($25/month - Recommended for Production):
- 100,000 monthly active users
- 8GB database
- 100GB file storage
- 250GB bandwidth
- Daily backups
- Priority support

## 📝 Step 9: Testing the Integration

1. **Test Authentication**:
   - Try registering a new user
   - Test login/logout functionality
   - Verify role-based access

2. **Test Database Operations**:
   - Add calendar events (as leader)
   - Submit contact forms
   - Search meeting archives

3. **Test Email Integration**:
   - Submit contact form
   - Check if email reaches joe.lafilm@gmail.com

## 🚨 Security Checklist

- [ ] Row Level Security (RLS) enabled on all tables
- [ ] API keys are the public/anon keys (never use service role key in frontend)
- [ ] Email confirmation enabled
- [ ] Strong database password set
- [ ] Proper redirect URLs configured
- [ ] Test all permission levels (member vs leader access)

## 🔄 Next Steps After Setup

1. **Deploy Updated Frontend**: Push changes to GitHub (will auto-deploy to GitHub Pages)
2. **Train Leadership**: Show leaders how to add events and manage content
3. **Member Onboarding**: Create registration process for new members
4. **Monitor Usage**: Use Supabase dashboard to monitor activity
5. **Backup Strategy**: Pro tier includes daily backups

## 📞 Support

- **Supabase Documentation**: [docs.supabase.com](https://docs.supabase.com)
- **Community Support**: [discord.gg/supabase](https://discord.gg/supabase)
- **Technical Issues**: Contact through the repository issues

## 🎯 Success Criteria

After completing this setup, you should have:

✅ **Working Authentication**: Members can register and log in
✅ **Role-Based Access**: Leaders can edit, members can view
✅ **Persistent Data**: All content saved to database
✅ **Email Integration**: Contact forms reach leadership
✅ **Search Functionality**: Meeting archives are searchable
✅ **Calendar Management**: Leaders can add/edit events
✅ **Scripture Packages**: System ready for AI-enhanced content

The platform will be fully functional with real user management, persistent data storage, and all the features needed for the brotherhood's spiritual flywheel process.