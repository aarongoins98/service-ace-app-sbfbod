
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
 * Note: This should be called from a secure context or Supabase Edge Function
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
