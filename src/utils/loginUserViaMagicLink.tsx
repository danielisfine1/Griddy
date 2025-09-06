'use client';

import { createClient } from "@/utils/supabase/client";

import { createModal } from "@/utils/modalHelper";

export const getCodeAccessTokenAndRefreshToken = () => {

    if (typeof window === "undefined") { return {}; };

    if (typeof window !== 'undefined') {

        const urlSearchParams = new URLSearchParams(window.location.search);
        const code = urlSearchParams.get("code");

        const error_description = urlSearchParams.get("error_description");

        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const access_token = hashParams.get('access_token');
        const refresh_token = hashParams.get('refresh_token');

        return {
            code,
            access_token,
            refresh_token,
            error_description
        };

    } else {

        return {
            code: null,
            access_token: null,
            refresh_token: null,
            error_description: null
        };

    };

};

export const logInUserViaMagicLink = async () => {

    const supabase = createClient();

    // There's a couple of ways an user is logged in via magic link...
    // It is possible that there will be a code parameter in the URL, which can be exchanged for a session. That's case 1.

    const { code, access_token, refresh_token, error_description } = getCodeAccessTokenAndRefreshToken();

    if (code) {

        const modal = await createModal(<div>Logging in...</div>);

        const handleMagicLinkLogin = async (code: string) => {

            const session = await supabase.auth.exchangeCodeForSession(code);

            if (session) {
                modal.set(<div>Successfully logged in! Redirecting...</div>);
                window.location.href = '/';
            } else {
                modal.set(<div>Error logging in. Please try again.</div>);
                console.error("Error exchanging code for session");
            };

        };

        handleMagicLinkLogin(code);

        if (error_description) {
            alert(error_description);
        };

        return {
            success: true,
            code: code,
            access_token: access_token,
            refresh_token: refresh_token,
        };

    } else if (access_token && refresh_token) {

        const modal = await createModal(<div>Logging in...</div>);

        // The second case is there's a session in the URL. This is done via hash parameters. This is case 2.

        const handleSetSession = async (access_token: string, refresh_token: string) => {

            const data = await supabase.auth.setSession({
                access_token,
                refresh_token,
            });

            return data;

        };

        const res = await handleSetSession(access_token, refresh_token);

        if (res.data.session && res.data.session?.access_token === access_token) {

            modal.set(<div>Successfully logged in! Redirecting...</div>);
            
            // Why are we comparing the access_token here? Because we want to make sure that the session is set correctly.

            window.location.href = '/';

        } else {

            modal.set(<div>Error logging in. Please try again.</div>);

            console.error("Error setting session");
        };

        return {
            success: true,
            code: code,
            access_token: access_token,
            refresh_token: refresh_token,
        };

    } else {

        return {
            success: false,
            code: code,
            access_token: access_token,
            refresh_token: refresh_token,
        };

    }

};