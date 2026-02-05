import { supabase } from '../supabase';

export interface AdminUser {
  id: string;
  username: string;
  password_hash: string;
  can_manage_admins: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AdminSession {
  id: string;
  username: string;
  can_manage_admins: boolean;
  login_time: string;
}

// Admin login
export async function loginAdmin(username: string, password: string) {
  try {
    const { data, error } = await supabase
      .from('admin_credentials')
      .select('*')
      .eq('username', username.toLowerCase())
      .single();

    if (error || !data) {
      throw new Error('Admin username not found');
    }

    if (!data.is_active) {
      throw new Error('This admin account is deactivated');
    }

    // Simple password comparison (in production, use proper hashing)
    if (data.password_hash !== password) {
      throw new Error('Invalid password');
    }

    // Store admin session in localStorage
    const adminSession: AdminSession = {
      id: data.id,
      username: data.username,
      can_manage_admins: data.can_manage_admins,
      login_time: new Date().toISOString(),
    };

    localStorage.setItem('admin_session', JSON.stringify(adminSession));
    return { success: true, admin: adminSession };
  } catch (error: any) {
    throw new Error(error.message || 'Login failed');
  }
}

// Get current admin session
export function getAdminSession(): AdminSession | null {
  try {
    const session = localStorage.getItem('admin_session');
    return session ? JSON.parse(session) : null;
  } catch {
    return null;
  }
}

// Logout admin
export function logoutAdmin() {
  localStorage.removeItem('admin_session');
}

// Add new admin (only for admins with can_manage_admins permission)
export async function addNewAdmin(
  username: string,
  password: string,
  canManageAdmins: boolean = false
) {
  try {
    // Check if username already exists
    const { data: existing } = await supabase
      .from('admin_credentials')
      .select('id')
      .eq('username', username.toLowerCase())
      .maybeSingle();

    if (existing) {
      throw new Error('Admin username already exists');
    }

    // Add new admin
    const { data, error } = await supabase
      .from('admin_credentials')
      .insert({
        username: username.toLowerCase(),
        password_hash: password,
        can_manage_admins: canManageAdmins,
        is_active: true,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error: any) {
    throw new Error(error.message || 'Failed to add admin');
  }
}

// Delete admin
export async function deleteAdmin(id: string) {
  try {
    const { error } = await supabase
      .from('admin_credentials')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return { success: true };
  } catch (error: any) {
    throw new Error(error.message || 'Failed to delete admin');
  }
}

// Get all admins
export async function getAllAdmins() {
  try {
    const { data, error } = await supabase
      .from('admin_credentials')
      .select('id, username, can_manage_admins, is_active, created_at')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error: any) {
    throw new Error(error.message || 'Failed to fetch admins');
  }
}

// Update admin password
export async function updateAdminPassword(id: string, newPassword: string) {
  try {
    const { error } = await supabase
      .from('admin_credentials')
      .update({ password_hash: newPassword, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) throw error;
    return { success: true };
  } catch (error: any) {
    throw new Error(error.message || 'Failed to update password');
  }
}

// Update admin permissions
export async function updateAdminPermissions(
  id: string,
  canManageAdmins: boolean
) {
  try {
    const { error } = await supabase
      .from('admin_credentials')
      .update({ can_manage_admins: canManageAdmins, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) throw error;
    return { success: true };
  } catch (error: any) {
    throw new Error(error.message || 'Failed to update permissions');
  }
}

// Toggle admin active status
export async function toggleAdminStatus(id: string, isActive: boolean) {
  try {
    const { error } = await supabase
      .from('admin_credentials')
      .update({ is_active: isActive, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) throw error;
    return { success: true };
  } catch (error: any) {
    throw new Error(error.message || 'Failed to update status');
  }
}

