# Critical Integration Updates Needed

## Files That Need Manual Updates

The following existing files need to be updated to work with the new backend:

### 1. index.html
```html
<!-- Add before closing </head> -->
<script src="https://unpkg.com/@supabase/supabase-js@2"></script>
<script src="backend/config/supabase.js"></script>

<!-- Replace at bottom -->
<script src="js/contact-enhanced.js"></script>
```

### 2. calendar.html
```html
<!-- Add before closing </head> -->
<script src="https://unpkg.com/@supabase/supabase-js@2"></script>
<script src="backend/config/supabase.js"></script>

<!-- Replace js/calendar.js with -->
<script src="js/calendar-enhanced.js"></script>
```

### 3. archives.html
```html
<!-- Add before closing </head> -->
<script src="https://unpkg.com/@supabase/supabase-js@2"></script>
<script src="backend/config/supabase.js"></script>

<!-- Replace js/archives.js with -->
<script src="js/archives-enhanced.js"></script>
```

### 4. scripture.html
```html
<!-- Add before closing </head> -->
<script src="https://unpkg.com/@supabase/supabase-js@2"></script>
<script src="backend/config/supabase.js"></script>

<!-- Replace js/scripture.js with -->
<script src="js/scripture-enhanced.js"></script>
```

## Missing API Functions
Add these to js/auth-supabase.js in the SupabaseAPI object:

```javascript
// Add these missing functions
async updateScripturePackage(id, updates) {
    const { data, error } = await supabaseClient
        .from('scripture_packages')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
    if (error) throw error;
    return data;
},

async getMeetingArchive(id) {
    const { data, error } = await supabaseClient
        .from('meeting_archives')
        .select('*')
        .eq('id', id)
        .single();
    if (error) throw error;
    return data;
}
```