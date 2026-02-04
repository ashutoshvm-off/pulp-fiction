import React, { useState, useEffect } from 'react';
import {
  getAllAdmins,
  addNewAdmin,
  deleteAdmin,
  updateAdminPermissions,
  AdminUser,
  getAdminSession,
  AdminSession,
} from '../lib/services/adminAuthService';

interface AdminListItem {
  id: string;
  admin_id: string;
  name: string;
  email?: string;
  can_manage_admins: boolean;
  created_at: string;
}

export const AdminManagement: React.FC = () => {
  const [admins, setAdmins] = useState<AdminListItem[]>([]);
  const [currentAdmin, setCurrentAdmin] = useState<AdminSession | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState<AdminListItem | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    adminId: '',
    password: '',
    email: '',
    name: '',
    canManageAdmins: false,
  });

  useEffect(() => {
    const admin = getAdminSession();
    setCurrentAdmin(admin);
    if (admin) {
      loadAdmins();
    }
  }, []);

  const loadAdmins = async () => {
    setLoading(true);
    setError(null);
    try {
      const adminList = await getAllAdmins();
      setAdmins(adminList);
    } catch (err: any) {
      setError(err.message || 'Failed to load admins');
    } finally {
      setLoading(false);
    }
  };

  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      if (!formData.adminId || !formData.password || !formData.name) {
        setError('Admin ID, password, and name are required');
        return;
      }

      if (currentAdmin && !currentAdmin.can_manage_admins) {
        setError('You do not have permission to add admins');
        return;
      }

      await addNewAdmin(
        formData.adminId,
        formData.password,
        formData.name,
        formData.email || undefined,
        formData.canManageAdmins
      );

      setSuccess(`Admin '${formData.name}' added successfully!`);
      setFormData({
        adminId: '',
        password: '',
        email: '',
        name: '',
        canManageAdmins: false,
      });
      setShowAddForm(false);
      await loadAdmins();
    } catch (err: any) {
      setError(err.message || 'Failed to add admin');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveAdmin = async (adminId: string) => {
    if (!window.confirm('Are you sure you want to remove this admin?')) {
      return;
    }

    if (currentAdmin?.admin_id === adminId) {
      setError('You cannot remove your own admin account');
      return;
    }

    setLoading(true);
    try {
      await deleteAdmin(adminId);
      setAdmins(admins.filter((a) => a.admin_id !== adminId));
      setSelectedAdmin(null);
      setSuccess('Admin removed successfully');
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to remove admin');
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePermission = async (adminId: string, currentPermission: boolean) => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      await updateAdminPermissions(adminId, !currentPermission);
      setAdmins(
        admins.map((a) =>
          a.admin_id === adminId ? { ...a, can_manage_admins: !currentPermission } : a
        )
      );
      setSelectedAdmin(
        selectedAdmin?.admin_id === adminId
          ? { ...selectedAdmin, can_manage_admins: !currentPermission }
          : selectedAdmin
      );
      setSuccess('Admin permissions updated');
    } catch (err: any) {
      setError(err.message || 'Failed to update permissions');
    } finally {
      setLoading(false);
    }
  };

  if (!currentAdmin) {
    return (
      <div className="p-6 text-center">
        <p className="text-red-600">Please log in to access admin management</p>
      </div>
    );
  }

  if (!currentAdmin.can_manage_admins) {
    return (
      <div className="p-6 text-center">
        <p className="text-red-600">You do not have permission to manage admins</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Admin Management</h2>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-green-800">{success}</p>
        </div>
      )}

      {/* Add Admin Button */}
      <button
        onClick={() => setShowAddForm(!showAddForm)}
        className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-6 rounded-lg transition"
        disabled={loading}
      >
        {showAddForm ? 'Cancel' : '+ Add New Admin'}
      </button>

      {/* Add Admin Form */}
      {showAddForm && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Add New Admin</h3>
          <form onSubmit={handleAddAdmin} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Admin ID</label>
                <input
                  type="text"
                  value={formData.adminId}
                  onChange={(e) => setFormData({ ...formData, adminId: e.target.value })}
                  placeholder="e.g., admin2"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-green-600"
                  disabled={loading}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Strong password"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-green-600"
                  disabled={loading}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Admin's full name"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-green-600"
                  disabled={loading}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email (Optional)</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="admin@example.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-green-600"
                  disabled={loading}
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="canManageAdmins"
                checked={formData.canManageAdmins}
                onChange={(e) => setFormData({ ...formData, canManageAdmins: e.target.checked })}
                className="w-4 h-4 rounded border-gray-300"
                disabled={loading}
              />
              <label htmlFor="canManageAdmins" className="text-sm font-medium text-gray-700">
                Can Manage Other Admins
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-semibold py-2 px-4 rounded-lg transition"
            >
              {loading ? 'Adding...' : 'Add Admin'}
            </button>
          </form>
        </div>
      )}

      {/* Admins Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Admin Accounts ({admins.length})</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Name</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Email</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Can Manage Admins</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Created</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {admins.map((admin) => (
                <tr key={admin.id} className="hover:bg-gray-50">
                  <td className="px-6 py-3 text-sm font-medium text-gray-900">{admin.name}</td>
                  <td className="px-6 py-3 text-sm text-gray-600">{admin.email || '-'}</td>
                  <td className="px-6 py-3 text-sm">
                    <button
                      onClick={() => handleTogglePermission(admin.admin_id, admin.can_manage_admins)}
                      className={`px-3 py-1 rounded text-xs font-semibold ${
                        admin.can_manage_admins
                          ? 'bg-green-100 text-green-800 hover:bg-green-200'
                          : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                      } transition disabled:opacity-50`}
                      disabled={loading}
                    >
                      {admin.can_manage_admins ? '✓ Yes' : '✗ No'}
                    </button>
                  </td>
                  <td className="px-6 py-3 text-sm text-gray-600">
                    {new Date(admin.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-3 text-sm">
                    {currentAdmin.admin_id !== admin.admin_id && (
                      <button
                        onClick={() => handleRemoveAdmin(admin.admin_id)}
                        disabled={loading}
                        className="text-red-600 hover:text-red-800 font-medium transition disabled:text-gray-400"
                      >
                        Delete
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
