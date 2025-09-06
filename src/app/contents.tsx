'use client';

import { useState, useEffect } from "react";
import { Button, TextField, Switch } from "@mui/material";

import { signInWithEmail } from "@/utils/signInWithEmail";
import { createAccount } from "@/utils/createAccount";

import { logInUserViaMagicLink } from "@/utils/loginUserViaMagicLink";

import { createModal } from "@/utils/modalHelper";

export const Home = () => {

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleCreateAccount = async () => {

        const { error } = await createAccount(email, password);

        if (error) {
            console.error(error);
        };

        createModal(<div className="font-xanh">A link has been sent to your email. Please check your inbox.</div>);

    };

    const handleLogin = async () => {

        const { error } = await signInWithEmail({ email, password });

        if (error) {
            console.error(error);
        };

        window.location.href = '/';

    };

    const [mode, setMode] = useState<'signin' | 'signup'>('signin');

    useEffect(() => {
        logInUserViaMagicLink();
    }, []);

    return (
        <div className="w-full h-screen flex flex-col md:flex-row justify-center items-center text-4xl gap-10">

            <div className="w-full flex flex-col gap-2 p-10">
                <h1 className="font-xanh">GRIDDY</h1>
                <h1 className="font-xanh">GRIDDY</h1>
                <h1 className="font-xanh">GRIDDY</h1>
                <h1 className="font-xanh">GRIDDY</h1>
                <h1 className="font-xanh">GRIDDY</h1>
            </div>

            <div className="w-full flex flex-col gap-2 p-10">

                <div className="w-full flex flex-col gap-2 p-10">
                    <TextField
                        label="Email"
                        variant="outlined"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                    <TextField
                        label="Password"
                        variant="outlined"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                    <div className="w-full flex flex-row gap-2 justify-end">
                        <Button fullWidth onClick={mode === 'signin' ? handleLogin : handleCreateAccount}>
                            {mode === 'signin' ? 'Sign In' : 'Sign Up'}
                        </Button>
                        <Switch
                            checked={mode === 'signin'}
                            onChange={(e) => setMode(e.target.checked ? 'signin' : 'signup')}
                        />
                    </div>
                </div>

            </div>

        </div>
    )

};