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

    // Update user metadata in Supabase Auth
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
      throw authError;
    }

    // Update user in our database
    const [updatedUser] = await db.update(users)
      .set({
        name,
        email,
        company,
        phone,
        address: typeof address === 'string' ? address : JSON.stringify(address),
        updated_at: new Date(),
      })
      .where(eq(users.id, id))
      .returning();

    if (!updatedUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(updatedUser);
  } catch (error) {
    console.error('Error updating user profile:', error);
    res.status(500).json({ error: 'Failed to update user profile' });
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