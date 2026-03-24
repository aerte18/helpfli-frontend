import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';

export default function RolesManagement({ companyId, canManage }) {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedRole, setSelectedRole] = useState(null);
  const [newRole, setNewRole] = useState({
    name: '',
    description: '',
    permissions: {
      team: { viewMembers: false, addMembers: false, removeMembers: false, changeMemberRoles: false },
      orders: { viewAll: false, create: false, assign: false, reassign: false, cancel: false },
      finances: { viewWallet: false, deposit: false, withdraw: false },
      resourcePool: { view: false, manageLimits: false },
      workflow: { view: false, configure: false },
      analytics: { view: false, export: false },
      settings: { view: false, edit: false, manageRoles: false }
    }
  });

  useEffect(() => {
    if (companyId) {
      fetchRoles();
    }
  }, [companyId]);

  const fetchRoles = async () => {
    try {
      setLoading(true);
      const data = await api(`/api/companies/${companyId}/roles`);
      if (data.success) {
        setRoles(data.roles);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRole = async (e) => {
    e.preventDefault();
    try {
      await api(`/api/companies/${companyId}/roles`, {
        method: 'POST',
        body: newRole
      });
      await fetchRoles();
      setShowCreateModal(false);
      setNewRole({
        name: '',
        description: '',
        permissions: {
          team: { viewMembers: false, addMembers: false, removeMembers: false, changeMemberRoles: false },
          orders: { viewAll: false, create: false, assign: false, reassign: false, cancel: false },
          finances: { viewWallet: false, deposit: false, withdraw: false },
          resourcePool: { view: false, manageLimits: false },
          workflow: { view: false, configure: false },
          analytics: { view: false, export: false },
          settings: { view: false, edit: false, manageRoles: false }
        }
      });
      alert('Rola została utworzona');
    } catch (err) {
      alert(`Błąd: ${err.message}`);
    }
  };

  const handleUpdateRole = async (updates) => {
    try {
      await api(`/api/companies/${companyId}/roles/${selectedRole._id}`, {
        method: 'PUT',
        body: updates
      });
      await fetchRoles();
      setShowEditModal(false);
      setSelectedRole(null);
      alert('Rola została zaktualizowana');
    } catch (err) {
      alert(`Błąd: ${err.message}`);
    }
  };

  const handleDeleteRole = async (roleId) => {
    if (!window.confirm('Czy na pewno chcesz usunąć tę rolę?')) {
      return;
    }
    try {
      await api(`/api/companies/${companyId}/roles/${roleId}`, {
        method: 'DELETE'
      });
      await fetchRoles();
      alert('Rola została usunięta');
    } catch (err) {
      alert(`Błąd: ${err.message}`);
    }
  };

  const togglePermission = (category, permission, value) => {
    if (selectedRole) {
      const updated = {
        ...selectedRole,
        permissions: {
          ...selectedRole.permissions,
          [category]: {
            ...selectedRole.permissions[category],
            [permission]: value
          }
        }
      };
      setSelectedRole(updated);
    } else {
      setNewRole({
        ...newRole,
        permissions: {
          ...newRole.permissions,
          [category]: {
            ...newRole.permissions[category],
            [permission]: value
          }
        }
      });
    }
  };

  const PermissionCategory = ({ title, category, permissions }) => {
    const rolePermissions = selectedRole ? selectedRole.permissions[category] : newRole.permissions[category];
    
    return (
      <div className="border border-gray-200 rounded-lg p-4">
        <h4 className="font-semibold text-gray-900 mb-3">{title}</h4>
        <div className="space-y-2">
          {Object.entries(permissions).map(([key, label]) => (
            <label key={key} className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={rolePermissions[key] || false}
                onChange={(e) => togglePermission(category, key, e.target.checked)}
                disabled={!canManage || (selectedRole && selectedRole.isDefault)}
                className="w-4 h-4 text-indigo-600 rounded"
              />
              <span className="text-sm text-gray-700">{label}</span>
            </label>
          ))}
        </div>
      </div>
    );
  };

  if (loading && roles.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="text-red-600">{error}</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Role i Uprawnienia</h2>
        {canManage && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            Utwórz rolę
          </button>
        )}
      </div>

      {roles.length === 0 ? (
        <div className="text-center text-gray-500 py-8">
          Brak ról. Utwórz pierwszą rolę aby rozpocząć.
        </div>
      ) : (
        <div className="space-y-4">
          {roles.map((role) => (
            <div key={role._id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <div className="font-semibold text-gray-900">{role.name}</div>
                  {role.description && (
                    <div className="text-sm text-gray-600">{role.description}</div>
                  )}
                  {role.isDefault && (
                    <span className="text-xs text-indigo-600">Domyślna</span>
                  )}
                </div>
                {canManage && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setSelectedRole(role);
                        setShowEditModal(true);
                      }}
                      className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                      disabled={role.isDefault}
                    >
                      Edytuj
                    </button>
                    {!role.isDefault && (
                      <button
                        onClick={() => handleDeleteRole(role._id)}
                        className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                      >
                        Usuń
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Role Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-md bg-white max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Utwórz nową rolę</h3>
            <form onSubmit={handleCreateRole}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nazwa roli *
                </label>
                <input
                  type="text"
                  value={newRole.name}
                  onChange={(e) => setNewRole({ ...newRole, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Opis
                </label>
                <textarea
                  value={newRole.description}
                  onChange={(e) => setNewRole({ ...newRole, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  rows="2"
                />
              </div>
              
              <div className="mb-6">
                <h4 className="font-semibold text-gray-900 mb-3">Uprawnienia</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <PermissionCategory
                    title="Zespół"
                    category="team"
                    permissions={{
                      viewMembers: 'Przeglądanie członków',
                      addMembers: 'Dodawanie członków',
                      removeMembers: 'Usuwanie członków',
                      changeMemberRoles: 'Zmiana ról członków'
                    }}
                  />
                  <PermissionCategory
                    title="Zlecenia"
                    category="orders"
                    permissions={{
                      viewAll: 'Przeglądanie wszystkich',
                      create: 'Tworzenie zleceń',
                      assign: 'Przypisywanie zleceń',
                      reassign: 'Przepisywanie zleceń',
                      cancel: 'Anulowanie zleceń'
                    }}
                  />
                  <PermissionCategory
                    title="Finanse"
                    category="finances"
                    permissions={{
                      viewWallet: 'Przeglądanie portfela',
                      deposit: 'Doładowanie portfela',
                      withdraw: 'Wypłata z portfela',
                    }}
                  />
                  <PermissionCategory
                    title="Resource Pool"
                    category="resourcePool"
                    permissions={{
                      view: 'Przeglądanie puli',
                      manageLimits: 'Zarządzanie limitami'
                    }}
                  />
                  <PermissionCategory
                    title="Workflow"
                    category="workflow"
                    permissions={{
                      view: 'Przeglądanie workflow',
                      configure: 'Konfiguracja workflow'
                    }}
                  />
                  <PermissionCategory
                    title="Analityka"
                    category="analytics"
                    permissions={{
                      view: 'Przeglądanie analityki',
                      export: 'Eksport danych'
                    }}
                  />
                  <PermissionCategory
                    title="Ustawienia"
                    category="settings"
                    permissions={{
                      view: 'Przeglądanie ustawień',
                      edit: 'Edycja ustawień',
                      manageRoles: 'Zarządzanie rolami'
                    }}
                  />
                </div>
              </div>
              
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setNewRole({
                      name: '',
                      description: '',
                      permissions: {
                        team: { viewMembers: false, addMembers: false, removeMembers: false, changeMemberRoles: false },
                        orders: { viewAll: false, create: false, assign: false, reassign: false, cancel: false },
                        finances: { viewWallet: false, deposit: false, withdraw: false },
                        resourcePool: { view: false, manageLimits: false },
                        workflow: { view: false, configure: false },
                        analytics: { view: false, export: false },
                        settings: { view: false, edit: false, manageRoles: false }
                      }
                    });
                  }}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                >
                  Anuluj
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                  Utwórz
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Role Modal */}
      {showEditModal && selectedRole && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-md bg-white max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Edytuj rolę: {selectedRole.name}</h3>
            <form onSubmit={(e) => {
              e.preventDefault();
              handleUpdateRole({
                name: selectedRole.name,
                description: selectedRole.description,
                permissions: selectedRole.permissions
              });
            }}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nazwa roli *
                </label>
                <input
                  type="text"
                  value={selectedRole.name}
                  onChange={(e) => setSelectedRole({ ...selectedRole, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  required
                  disabled={selectedRole.isDefault}
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Opis
                </label>
                <textarea
                  value={selectedRole.description || ''}
                  onChange={(e) => setSelectedRole({ ...selectedRole, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  rows="2"
                />
              </div>
              
              <div className="mb-6">
                <h4 className="font-semibold text-gray-900 mb-3">Uprawnienia</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <PermissionCategory
                    title="Zespół"
                    category="team"
                    permissions={{
                      viewMembers: 'Przeglądanie członków',
                      addMembers: 'Dodawanie członków',
                      removeMembers: 'Usuwanie członków',
                      changeMemberRoles: 'Zmiana ról członków'
                    }}
                  />
                  <PermissionCategory
                    title="Zlecenia"
                    category="orders"
                    permissions={{
                      viewAll: 'Przeglądanie wszystkich',
                      create: 'Tworzenie zleceń',
                      assign: 'Przypisywanie zleceń',
                      reassign: 'Przepisywanie zleceń',
                      cancel: 'Anulowanie zleceń'
                    }}
                  />
                  <PermissionCategory
                    title="Finanse"
                    category="finances"
                    permissions={{
                      viewWallet: 'Przeglądanie portfela',
                      deposit: 'Doładowanie portfela',
                      withdraw: 'Wypłata z portfela',
                    }}
                  />
                  <PermissionCategory
                    title="Resource Pool"
                    category="resourcePool"
                    permissions={{
                      view: 'Przeglądanie puli',
                      manageLimits: 'Zarządzanie limitami'
                    }}
                  />
                  <PermissionCategory
                    title="Workflow"
                    category="workflow"
                    permissions={{
                      view: 'Przeglądanie workflow',
                      configure: 'Konfiguracja workflow'
                    }}
                  />
                  <PermissionCategory
                    title="Analityka"
                    category="analytics"
                    permissions={{
                      view: 'Przeglądanie analityki',
                      export: 'Eksport danych'
                    }}
                  />
                  <PermissionCategory
                    title="Ustawienia"
                    category="settings"
                    permissions={{
                      view: 'Przeglądanie ustawień',
                      edit: 'Edycja ustawień',
                      manageRoles: 'Zarządzanie rolami'
                    }}
                  />
                </div>
              </div>
              
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedRole(null);
                  }}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                >
                  Anuluj
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                  Zapisz
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}







