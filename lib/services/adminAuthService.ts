import { supabase } from '../supabase';

export interface AdminUser {
  id: string;
  admin_id: string;
  password: string;
  name: string;
  email?: string;
  can_manage_admins: boolean;
  created_at: string;
  updated_at: string;
}

export interface AdminSession {
  id: string;
  admin_id: string;
  name: string;
  email?: string;
  can_manage_admins: boolean;
  login_time: string;
}

// Admin login
export async function loginAdmin(adminId: string, password: string) {
  try {
    const { data, error } = await supabase
      .from('admin_credentials')
      .select('*')
      .eq('admin_id', adminId)
      .single();

    if (error || !data) {
      throw new Error('Admin ID not found');
    }

    // Simple password comparison
    if (data.password !== password) {
      throw new Error('Invalid password');
    }

    // Store admin session in localStorage
    const adminSession: AdminSession = {
      id: data.id,
      admin_id: data.admin_id,
      name: data.name,
      email: data.email,
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
  adminId: string,
  password: string,
  name: string,
  email?: string,
  canManageAdmins: boolean = false
) {
  try {
    // Check if admin_id already exists
    const { data: existing } = await supabase
      .from('admin_credentials')
      .select('id')
      .eq('admin_id', adminId)
      .single();

    if (existing) {
      throw new Error('Admin ID already exists');
    }

    // Add new admin
    const { data, error } = await supabase
      .from('admin_credentials')
      .insert({
        admin_id: adminId,
        password: password,
        name: name,
        email: email || null,
        can_manage_admins: canManageAdmins,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error: any) {
    throw new Error(error.message || 'Failed to add admin');
  }
}

// Delete admin (only for admins with can_manage_admins permission)
export async function deleteAdmin(adminId: string) {
  try {
    const { error } = await supabase
      .from('admin_credentials')
      .delete()
      .eq('admin_id', adminId);

    if (error) throw error;
    return { success: true };
  } catch (error: any) {
    throw new Error(error.message || 'Failed to delete admin');
  }
}

// Get all admins (only for admins with can_manage_admins permission)
export async function getAllAdmins() {
  try {
    const { data, error } = await supabase
      .from('admin_credentials')
      .select('id, admin_id, name, email, can_manage_admins, created_at')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error: any) {
    throw new Error(error.message || 'Failed to fetch admins');
  }
}

// Update admin password
export async function updateAdminPassword(adminId: string, newPassword: string) {
  try {
    const { error } = await supabase
      .from('admin_credentials')
      .update({ password: newPassword, updated_at: new Date().toISOString() })
      .eq('admin_id', adminId);

    if (error) throw error;
    return { success: true };
  } catch (error: any) {
    throw new Error(error.message || 'Failed to update password');
  }
}

// Update admin permissions
export async function updateAdminPermissions(
  adminId: string,
  canManageAdmins: boolean
) {
  try {
    const { error } = await supabase
      .from('admin_credentials')
      .update({ can_manage_admins: canManageAdmins, updated_at: new Date().toISOString() })
      .eq('admin_id', adminId);

    if (error) throw error;
    return { success: true };
  } catch (error: any) {
    throw new Error(error.message || 'Failed to update permissions');
  }
}

