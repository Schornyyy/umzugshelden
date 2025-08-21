'use client';

import { useEffect, useRef } from 'react';
import { saveClick } from '@/actions/userActions';

export default function TrackCompanyView({ companyId }: { companyId: string }) {
  const sentRef = useRef(false);

  useEffect(() => {
    if (!companyId || sentRef.current) return;
    sentRef.current = true;
    // Log a profile view for this company
    void saveClick('company', companyId);
  }, [companyId]);

  return null;
}
