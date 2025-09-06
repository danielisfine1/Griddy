'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';

export default function SignOutPage() {
    const router = useRouter();

    useEffect(() => {
        const supabase = createClient();

        const signOut = async () => {
            await supabase.auth.signOut();
            router.replace('/');
        };

        signOut();
    }, [router]);

    return <div className="font-xahn p-4 text-center">Signing out…</div>;
};