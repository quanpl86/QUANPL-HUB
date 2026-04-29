'use client';

import React, { useTransition } from 'react';
import { CyberButton } from '@/components/ui/CyberButton';
import { toast } from 'sonner';

interface UserRoleButtonProps {
  userId: string;
  currentRole: 'admin' | 'user';
  updateRole: (userId: string, role: 'admin' | 'user') => Promise<{ success: boolean; error?: string }>;
}

export function UserRoleButton({ userId, currentRole, updateRole }: UserRoleButtonProps) {
  const [isPending, startTransition] = useTransition();

  const handleToggle = async () => {
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    const confirmMsg = `Are you sure you want to ${newRole === 'admin' ? 'UPGRADE' : 'DOWNGRADE'} this entity?`;
    
    if (!confirm(confirmMsg)) return;

    startTransition(async () => {
      try {
        const result = await updateRole(userId, newRole);
        if (result.success) {
          toast.success(`AUTHORITY_RESTRICTED: ${newRole.toUpperCase()} privilege ${newRole === 'admin' ? 'granted' : 'revoked'}`);
        } else {
          toast.error(`SYSTEM_ERROR: ${result.error}`);
        }
      } catch (error) {
        toast.error('ACCESS_DENIED: Matrix authority override failed');
      }
    });
  };

  return (
    <CyberButton 
      variant="secondary" 
      className="text-[9px] py-2 px-4 min-w-[120px]"
      disabled={isPending}
      onClick={handleToggle}
    >
      {isPending ? 'PROCESSING...' : currentRole === 'admin' ? 'DOWNGRADE TO USER' : 'UPGRADE TO ADMIN'}
    </CyberButton>
  );
}
