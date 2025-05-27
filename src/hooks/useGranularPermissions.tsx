
import { useState } from 'react';

interface PagePermission {
  view: boolean;
  edit: boolean;
  delete: boolean;
}

export const useGranularPermissions = (initialPermissions: Record<string, PagePermission> = {}) => {
  const [selectedPermissions, setSelectedPermissions] = useState<Record<string, PagePermission>>(
    initialPermissions
  );

  const handlePermissionToggle = (pageId: string, action: keyof PagePermission) => {
    setSelectedPermissions(prev => ({
      ...prev,
      [pageId]: {
        ...prev[pageId],
        [action]: !prev[pageId]?.[action]
      }
    }));
  };

  const resetPermissions = () => {
    setSelectedPermissions({});
  };

  const setPermissions = (permissions: Record<string, PagePermission>) => {
    setSelectedPermissions(permissions);
  };

  return {
    selectedPermissions,
    handlePermissionToggle,
    resetPermissions,
    setPermissions
  };
};
