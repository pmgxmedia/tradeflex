# AdminSettings Component - User Guide

## Accessing the Settings Panel

Navigate to the Admin Dashboard and click on the **Settings** menu item to access the settings management panel.

## Quick Start Guide

### 1. Viewing Settings
- The settings panel opens with the **General** tab active by default
- Click any tab on the left sidebar to view different setting categories
- All fields display current values from the database

### 2. Modifying Settings

#### Option A: Save Individual Sections
1. Navigate to the desired tab (General, Email, Payment, etc.)
2. Make your changes
3. Click the **"Save [Section] Settings"** button at the bottom
4. Wait for the success confirmation

#### Option B: Save All Changes at Once
1. Make changes across multiple tabs
2. Notice the yellow "Unsaved Changes" banner appears
3. Click **"Save All Changes"** button in the top-right header
4. All modifications are saved in one operation

### 3. Discarding Changes
If you want to cancel your modifications:
1. Click the **"Discard Changes"** button in the top-right
2. All unsaved changes will be reverted to the last saved state

### 4. Resetting to Defaults
To restore factory default settings:
1. Click **"Reset to Defaults"** button in the header
2. Review the warning in the confirmation modal
3. Click **"Reset to Defaults"** in the modal to confirm
4. All settings will be restored to their original values

### 5. Using the Advanced Tab

The **Advanced** tab provides power-user features:

#### Settings Overview
- View statistics about your configuration
- See total settings count and modification status

#### Settings Table
- Browse all settings in a comprehensive table
- Each row shows: Key, Value, Type, and Category
- Settings are color-coded by category
- Sensitive data (passwords, secrets) are masked

#### Bulk Actions
- **Refresh Settings**: Reload current values from database
- **Save All Settings**: Batch save all modifications
- **Reset All to Defaults**: Complete system reset

#### Export Settings
- Click **"Export Settings JSON"** to download a backup
- File is automatically named with current date
- Use for backup, migration, or documentation

## Settings Categories

### General Settings
- **Site Name**: Your store's display name
- **Site Email**: Primary contact email
- **Currency**: Default currency (ZAR, USD, EUR, etc.)
- **Timezone**: Store timezone
- **Language**: Interface language

### Email Settings
- **SMTP Host**: Mail server address
- **SMTP Port**: Mail server port (default: 587)
- **SMTP Username**: Email account username
- **SMTP Password**: Email account password
- **From Name**: Sender name for emails
- **From Email Address**: Reply-to email address

### Payment Settings
- **Stripe**: Enable/disable and configure Stripe
  - Publishable Key
  - Secret Key
- **PayPal**: Enable/disable and configure PayPal
  - Client ID
  - Client Secret

### Security Settings
- **Two-Factor Authentication**: Enable 2FA (toggle)
- **Maintenance Mode**: Put site into maintenance mode
  - Customize maintenance message

### Notification Settings
- **Order Notifications**: Get notified of new orders
- **Low Stock Alerts**: Alert when inventory is low
  - Set threshold quantity
- **Review Notifications**: Notify on new reviews

## Tips and Best Practices

### ✅ Do's
- ✅ Test email settings before relying on them
- ✅ Export settings before major changes
- ✅ Save frequently when making multiple changes
- ✅ Keep payment credentials secure
- ✅ Use the Advanced tab to audit all settings

### ❌ Don'ts
- ❌ Don't refresh the page with unsaved changes
- ❌ Don't share your settings export publicly (contains secrets)
- ❌ Don't enable maintenance mode during peak hours
- ❌ Don't reset settings unless absolutely necessary

## Visual Indicators

### Status Colors
- 🔵 **Blue**: General settings
- 🟣 **Purple**: Email configuration
- 🟢 **Green**: Payment settings
- 🔴 **Red**: Security settings
- 🟡 **Yellow**: Notification settings

### Alert Types
- **Yellow Banner**: Unsaved changes present
- **Green Alert**: Successful operation
- **Red Alert**: Error occurred
- **Blue Alert**: Informational message

## Troubleshooting

### Changes Not Saving
1. Check for error alerts at the top of the page
2. Verify you have admin permissions
3. Check your internet connection
4. Try refreshing and saving again

### Settings Not Loading
1. Click the "Refresh Settings" button in Advanced tab
2. Check backend server is running
3. Verify database connectivity
4. Check browser console for errors

### Export Not Working
1. Check browser allows file downloads
2. Disable pop-up blockers temporarily
3. Ensure you have write permissions

## Keyboard Shortcuts

While there are no specific keyboard shortcuts, you can use:
- **Tab**: Navigate between form fields
- **Enter**: Submit when focused on a button
- **Esc**: Close modals (when implemented in Modal component)

## Support

For additional help:
1. Check the SETTINGS_CRUD_DOCUMENTATION.md for technical details
2. Review backend logs for API errors
3. Contact your system administrator
4. Check the README.md for system requirements

---

**Last Updated**: January 2026
**Component Version**: 2.0.0 (CRUD Enhanced)
