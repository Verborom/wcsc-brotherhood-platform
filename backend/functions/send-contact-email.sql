-- Supabase Edge Function for sending contact form emails
-- This function handles email notifications when contact forms are submitted

CREATE OR REPLACE FUNCTION send_contact_email(
    contact_name TEXT,
    contact_email TEXT,
    contact_phone TEXT DEFAULT NULL,
    chapter_interest TEXT DEFAULT NULL,
    message_content TEXT
)
RETURNS JSON AS $$
DECLARA TION
    email_body TEXT;
    email_subject TEXT;
BEGIN
    -- Build email subject
    email_subject := 'New Contact Form Submission - ' || contact_name;
    
    -- Build email body
    email_body := 'New contact form submission from the WCSC Brotherhood website:' || E'\n\n' ||
                  'Name: ' || contact_name || E'\n' ||
                  'Email: ' || contact_email || E'\n' ||
                  'Phone: ' || COALESCE(contact_phone, 'Not provided') || E'\n' ||
                  'Chapter Interest: ' || COALESCE(chapter_interest, 'Not specified') || E'\n\n' ||
                  'Message:' || E'\n' || message_content || E'\n\n' ||
                  '---' || E'\n' ||
                  'Submitted: ' || NOW()::TEXT || E'\n' ||
                  'Source: Website Contact Form' || E'\n\n' ||
                  'Please follow up with this inquiry promptly.';
    
    -- In a real implementation, you would integrate with an email service here
    -- For now, we'll just log the email details
    
    -- Log the email (you can view these in Supabase logs)
    RAISE NOTICE 'Email would be sent to joe.lafilm@gmail.com';
    RAISE NOTICE 'Subject: %', email_subject;
    RAISE NOTICE 'Body: %', email_body;
    
    -- Return success response
    RETURN json_build_object(
        'success', true,
        'message', 'Email notification logged successfully',
        'recipient', 'joe.lafilm@gmail.com',
        'subject', email_subject
    );
    
EXCEPTION
    WHEN OTHERS THEN
        -- Return error response
        RETURN json_build_object(
            'success', false,
            'error', SQLERRM
        );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION send_contact_email TO authenticated;

-- Create a trigger function to automatically send email when contact submission is inserted
CREATE OR REPLACE FUNCTION trigger_send_contact_email()
RETURNS TRIGGER AS $$
BEGIN
    -- Call the email function
    PERFORM send_contact_email(
        NEW.name,
        NEW.email,
        NEW.phone,
        NEW.chapter_interest,
        NEW.message
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on contact_submissions table
DROP TRIGGER IF EXISTS send_email_on_contact_submission ON contact_submissions;
CREATE TRIGGER send_email_on_contact_submission
    AFTER INSERT ON contact_submissions
    FOR EACH ROW EXECUTE FUNCTION trigger_send_contact_email();

-- Note: For production, you would replace the RAISE NOTICE statements
-- with actual email sending logic using services like:
-- - SendGrid API
-- - AWS SES
-- - Mailgun
-- - SMTP server
-- - Supabase Edge Functions with email service integration