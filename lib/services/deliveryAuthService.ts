import { supabase } from '../supabase';

export interface DeliveryAgent {
  id: string;
  username: string;
  full_name: string;
  phone: string;
  is_active: boolean;
}

export interface DeliverySession {
  id: string;
  username: string;
  full_name: string;
  phone: string;
}

const DELIVERY_SESSION_KEY = 'delivery_agent_session';

export const loginDeliveryAgent = async (
  username: string,
  password: string
): Promise<{ success: boolean; agent?: DeliverySession; error?: string }> => {
  try {
    const { data, error } = await supabase
      .from('delivery_agents')
      .select('id, username, full_name, phone, password_hash, is_active')
      .eq('username', username.toLowerCase())
      .single();

    if (error || !data) {
      return { success: false, error: 'Invalid username or password' };
    }

    if (!data.is_active) {
      return { success: false, error: 'Account is deactivated. Contact admin.' };
    }

    // Simple password check (in production, use proper hashing)
    if (data.password_hash !== password) {
      return { success: false, error: 'Invalid username or password' };
    }

    const session: DeliverySession = {
      id: data.id,
      username: data.username,
      full_name: data.full_name,
      phone: data.phone,
    };

    // Store session in localStorage
    localStorage.setItem(DELIVERY_SESSION_KEY, JSON.stringify(session));

    return { success: true, agent: session };
  } catch (err: any) {
    return { success: false, error: err.message || 'Login failed' };
  }
};

export const getDeliverySession = (): DeliverySession | null => {
  try {
    const sessionStr = localStorage.getItem(DELIVERY_SESSION_KEY);
    if (!sessionStr) return null;
    return JSON.parse(sessionStr);
  } catch {
    return null;
  }
};

export const logoutDeliveryAgent = (): void => {
  localStorage.removeItem(DELIVERY_SESSION_KEY);
};

// Admin functions for managing delivery agents
export const getAllDeliveryAgents = async (): Promise<DeliveryAgent[]> => {
  const { data, error } = await supabase
    .from('delivery_agents')
    .select('id, username, full_name, phone, is_active, created_at')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
};

export const createDeliveryAgent = async (
  username: string,
  password: string,
  fullName: string,
  phone: string
): Promise<DeliveryAgent> => {
  const { data, error } = await supabase
    .from('delivery_agents')
    .insert({
      username: username.toLowerCase(),
      password_hash: password,
      full_name: fullName,
      phone: phone,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const updateDeliveryAgent = async (
  id: string,
  updates: { full_name?: string; phone?: string; password_hash?: string; is_active?: boolean }
): Promise<void> => {
  const { error } = await supabase
    .from('delivery_agents')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) throw error;
};

export const deleteDeliveryAgent = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('delivery_agents')
    .delete()
    .eq('id', id);

  if (error) throw error;
};
