import { Router } from 'express';
import { auth } from '../middleware/auth';
import { db } from '../lib/db';
import { users, userSettings } from '../lib/schema';
import { eq } from 'drizzle-orm';
import { createClient } from '@supabase/supabase-js';

const router = Router();

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Utility to convert camelCase to snake_case for user_settings
function toSnakeCaseSettings(data: any) {
  if (!data) return data;
  return {
    ...data,
    fontsize: data.fontSize ?? data.fontsize,
    dateformat: data.dateFormat ?? data.dateformat,
    twofactorauth: data.twoFactorAuth ?? data.twofactorauth,
    sessiontimeout: data.sessionTimeout ?? data.sessiontimeout,
    loginnotifications: data.loginNotifications ?? data.loginnotifications,
    emailnotifications: data.emailNotifications ?? data.emailnotifications,
    invoicereminders: data.invoiceReminders ?? data.invoicereminders,
    paymentnotifications: data.paymentNotifications ?? data.paymentnotifications,
    marketingemails: data.marketingEmails ?? data.marketingemails,
    reminderfrequency: data.reminderFrequency ?? data.reminderfrequency,
    // Remove camelCase keys
    fontSize: undefined,
    dateFormat: undefined,
    twoFactorAuth: undefined,
    sessionTimeout: undefined,
    loginNotifications: undefined,
    emailNotifications: undefined,
    invoiceReminders: undefined,
    paymentNotifications: undefined,
    marketingEmails: undefined,
    reminderFrequency: undefined,
  };
}

// Get user profile
router.get('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    if (id !== req.user?.id) {
      return res.status(403).json({ error: 'Unauthorized to access this profile' });
    }

    const user = await db.query.users.findFirst({
      where: eq(users.id, id),
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ error: 'Failed to fetch user profile' });
  }
});

// Update user profile
router.put('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    if (id !== req.user?.id) {
      return res.status(403).json({ error: 'Unauthorized to update this profile' });
    }

    const {
      name,
      email,
      company,
      jobTitle,
      phone,
      mobilePhone,
      website,
      address,
      bio,
      dateOfBirth,
      gender,
      avatar_url,
    } = req.body;

    console.log('Updating user profile:', { id, name, email, company });

    // First, update user in our database
    try {
      const [updatedUser] = await db.update(users)
        .set({
          name,
          email,
          company,
          phone,
          job_title: jobTitle,
          address: typeof address === 'object' ? JSON.stringify(address) : address,
          bio,
          date_of_birth: dateOfBirth ? new Date(dateOfBirth) : undefined,
          gender,
          profile_picture: avatar_url,
          updated_at: new Date(),
        })
        .where(eq(users.id, id))
        .returning();

      if (!updatedUser) {
        console.error('User not found in database:', id);
        return res.status(404).json({ error: 'User not found in database' });
      }

      // Then update user metadata in Supabase Auth
      const { error: authError } = await supabase.auth.admin.updateUserById(id, {
        email,
        user_metadata: {
          name,
          company,
          jobTitle,
          phone,
          mobilePhone,
          website,
          address,
          bio,
          dateOfBirth,
          gender,
          avatar_url,
        },
      });

      if (authError) {
        console.error('Supabase auth update error:', authError);
        // Even if Supabase update fails, we still return the database update
        // but log the error for debugging
        return res.status(200).json({
          ...updatedUser,
          warning: 'Profile updated in database but Supabase update failed',
          authError: authError.message
        });
      }

      res.json(updatedUser);
    } catch (dbError) {
      console.error('Database update error:', dbError);
      throw dbError; // This will be caught by the outer try-catch
    }
  } catch (error) {
    console.error('Error updating user profile:', error);
    // Send more specific error message
    const errorMessage = error instanceof Error ? error.message : 'Failed to update user profile';
    res.status(500).json({ 
      error: errorMessage,
      details: error instanceof Error ? error.stack : undefined
    });
  }
});

// Get user settings
router.get('/:id/settings', auth, async (req, res) => {
  try {
    const { id } = req.params;
    if (id !== req.user?.id) {
      return res.status(403).json({ error: 'Unauthorized to access these settings' });
    }
    const settings = await db.query.userSettings.findFirst({
      where: eq(userSettings.user_id, id),
    });
    // Always return snake_case
    res.json(toSnakeCaseSettings(settings) || {});
  } catch (error) {
    console.error('Error fetching user settings:', error);
    res.status(500).json({ error: 'Failed to fetch user settings' });
  }
});

// Update user settings
router.put('/:id/settings', auth, async (req, res) => {
  try {
    const { id } = req.params;
    if (id !== req.user?.id) {
      return res.status(403).json({ error: 'Unauthorized to update these settings' });
    }
    const { type, ...settings } = req.body;
    // Convert to snake_case before saving
    const snakeSettings = toSnakeCaseSettings(settings);
    // Update or insert settings based on type
    const [updatedSettings] = await db.insert(userSettings)
      .values({
        user_id: id,
        ...snakeSettings,
        updated_at: new Date(),
      })
      .onConflictDoUpdate({
        target: [userSettings.user_id],
        set: {
          ...snakeSettings,
          updated_at: new Date(),
        },
      })
      .returning();
    // Always return snake_case
    res.json(toSnakeCaseSettings(updatedSettings));
  } catch (error) {
    console.error('Error updating user settings:', error);
    res.status(500).json({ error: 'Failed to update user settings' });
  }
});

export default router; 