
import { supabase } from "@/app/integrations/supabase/client";

/**
 * Check if an email is authorized as an admin
 */
export async function isAdminEmail(email: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('admin_users')
      .select('email, is_active')
      .eq('email', email.toLowerCase().trim())
      .eq('is_active', true)
      .single();

    if (error || !data) {
      console.log("Email not found in admin_users or inactive:", email);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error checking admin email:", error);
    return false;
  }
}

/**
 * Verify admin login credentials
 */
export async function verifyAdminLogin(email: string, password: string): Promise<{ success: boolean; message: string }> {
  try {
    const emailLower = email.toLowerCase().trim();
    
    // Check if email is in admin_users
    const { data: adminData, error: adminError } = await supabase
      .from('admin_users')
      .select('email, is_active')
      .eq('email', emailLower)
      .eq('is_active', true)
      .single();

    if (adminError || !adminData) {
      return { success: false, message: "Email not authorized for admin access" };
    }

    // Check password
    const { data: passwordData, error: passwordError } = await supabase
      .from('admin_passwords')
      .select('email, password_hash, is_active')
      .eq('email', emailLower)
      .eq('is_active', true)
      .single();

    if (passwordError || !passwordData) {
      return { success: false, message: "No password set for this admin account" };
    }

    // Simple password verification
    if (passwordData.password_hash !== password) {
      return { success: false, message: "Invalid password" };
    }

    return { success: true, message: "Login successful" };
  } catch (error) {
    console.error("Error verifying admin login:", error);
    return { success: false, message: "An error occurred during login" };
  }
}

/**
 * Change admin password
 */
export async function changeAdminPassword(email: string, currentPassword: string, newPassword: string): Promise<{ success: boolean; message: string }> {
  try {
    const emailLower = email.toLowerCase().trim();
    
    // Verify current password first
    const verifyResult = await verifyAdminLogin(emailLower, currentPassword);
    if (!verifyResult.success) {
      return { success: false, message: "Current password is incorrect" };
    }

    // Update password
    const { error } = await supabase
      .from('admin_passwords')
      .update({ 
        password_hash: newPassword,
        updated_at: new Date().toISOString() 
      })
      .eq('email', emailLower);

    if (error) {
      console.error("Error updating password:", error);
      return { success: false, message: "Failed to update password" };
    }

    return { success: true, message: "Password updated successfully" };
  } catch (error) {
    console.error("Error in changeAdminPassword:", error);
    return { success: false, message: "An error occurred while changing password" };
  }
}

/**
 * Set admin password (for initial setup or reset)
 */
export async function setAdminPassword(email: string, password: string): Promise<{ success: boolean; message: string }> {
  try {
    const emailLower = email.toLowerCase().trim();
    
    // Check if admin exists
    const { data: adminData, error: adminError } = await supabase
      .from('admin_users')
      .select('email')
      .eq('email', emailLower)
      .single();

    if (adminError || !adminData) {
      return { success: false, message: "Admin email not found" };
    }

    // Upsert password
    const { error } = await supabase
      .from('admin_passwords')
      .upsert({ 
        email: emailLower,
        password_hash: password,
        is_active: true,
        updated_at: new Date().toISOString() 
      }, {
        onConflict: 'email'
      });

    if (error) {
      console.error("Error setting password:", error);
      return { success: false, message: "Failed to set password" };
    }

    return { success: true, message: "Password set successfully" };
  } catch (error) {
    console.error("Error in setAdminPassword:", error);
    return { success: false, message: "An error occurred while setting password" };
  }
}

/**
 * Get all admin users
 */
export async function getAllAdminUsers() {
  try {
    const { data, error } = await supabase
      .from('admin_users')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error("Error fetching admin users:", error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error("Error in getAllAdminUsers:", error);
    return [];
  }
}

/**
 * Add a new admin user (requires existing admin privileges)
 */
export async function addAdminUser(email: string) {
  try {
    const { data, error } = await supabase
      .from('admin_users')
      .insert([{ email: email.toLowerCase().trim() }])
      .select()
      .single();

    if (error) {
      console.error("Error adding admin user:", error);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (error) {
    console.error("Error in addAdminUser:", error);
    return { success: false, error: String(error) };
  }
}

/**
 * Deactivate an admin user
 */
export async function deactivateAdminUser(email: string) {
  try {
    const { data, error } = await supabase
      .from('admin_users')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('email', email.toLowerCase().trim())
      .select()
      .single();

    if (error) {
      console.error("Error deactivating admin user:", error);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (error) {
    console.error("Error in deactivateAdminUser:", error);
    return { success: false, error: String(error) };
  }
}

/**
 * Reactivate an admin user
 */
export async function reactivateAdminUser(email: string) {
  try {
    const { data, error } = await supabase
      .from('admin_users')
      .update({ is_active: true, updated_at: new Date().toISOString() })
      .eq('email', email.toLowerCase().trim())
      .select()
      .single();

    if (error) {
      console.error("Error reactivating admin user:", error);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (error) {
    console.error("Error in reactivateAdminUser:", error);
    return { success: false, error: String(error) };
  }
}
