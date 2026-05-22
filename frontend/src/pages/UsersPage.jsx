import React, { useEffect, useState } from 'react';
import useAppStore from '../store/useAppStore';

export default function UsersPage() {
  const { users, usersLoading, fetchUsers, createUser, updateUserRole, deleteUser, user } = useAppStore();
  const [showModal, setShowModal] = useState(false);
  const [newUser, setNewUser] = useState({ username: '', password: '', role: 'viewer' });
  const [error, setError] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await createUser(newUser);
      setShowModal(false);
      setNewUser({ username: '', password: '', role: 'viewer' });
      fetchUsers();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create user');
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      await updateUserRole(userId, newRole);
      fetchUsers();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to update role');
    }
  };

  const handleDelete = async (userId) => {
    try {
      await deleteUser(userId);
      setDeleteConfirm(null);
      fetchUsers();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to delete user');
    }
  };

  if (user?.role !== 'admin') {
    return (
      <div className="page-container">
        <div className="page-content">
          <p>Access denied. Admin only.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-content">
        <div className="page-header">
          <h1>User Management</h1>
          <button className="btn-primary" onClick={() => setShowModal(true)}>
            Add User
          </button>
        </div>

        {error && <div className="error-message">{error}</div>}

        {usersLoading ? (
          <p>Loading...</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Username</th>
                <th>Role</th>
                <th>Last Login</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td>{u.username}</td>
                  <td>
                    <select
                      value={u.role}
                      onChange={(e) => handleRoleChange(u.id, e.target.value)}
                      disabled={u.id === user?.id}
                    >
                      <option value="admin">admin</option>
                      <option value="editor">editor</option>
                      <option value="viewer">viewer</option>
                    </select>
                  </td>
                  <td>{u.last_login || '-'}</td>
                  <td>{u.created_at ? new Date(u.created_at).toLocaleDateString() : '-'}</td>
                  <td>
                    {u.id !== user?.id && (
                      <button
                        className="btn-sm btn-danger"
                        onClick={() => setDeleteConfirm(u.id)}
                      >
                        Delete
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {showModal && (
          <div className="modal-overlay" onClick={() => setShowModal(false)}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <h2>Create New User</h2>
              <form onSubmit={handleCreateUser}>
                <div className="form-group">
                  <label>Username</label>
                  <input
                    type="text"
                    value={newUser.username}
                    onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Password</label>
                  <input
                    type="password"
                    value={newUser.password}
                    onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Role</label>
                  <select
                    value={newUser.role}
                    onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                  >
                    <option value="viewer">viewer</option>
                    <option value="editor">editor</option>
                    <option value="admin">admin</option>
                  </select>
                </div>
                <div className="modal-actions">
                  <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary">
                    Create
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {deleteConfirm && (
          <div className="modal-overlay" onClick={() => setDeleteConfirm(null)}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <h2>Confirm Delete</h2>
              <p>Are you sure you want to delete this user?</p>
              <div className="modal-actions">
                <button className="btn-secondary" onClick={() => setDeleteConfirm(null)}>
                  Cancel
                </button>
                <button className="btn-danger" onClick={() => handleDelete(deleteConfirm)}>
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}