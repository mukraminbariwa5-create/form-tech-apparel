import { Head, Link, useForm } from '@inertiajs/react';
import type { FormEvent } from 'react';
import Wordmark from '../../components/wordmark';

export default function Login() {
    const form = useForm({ email: '', password: '' });
    function submit(event: FormEvent) {
        event.preventDefault();
        form.post('/login', { onFinish: () => form.reset('password') });
    }
    return <main className="auth-page"><Head title="Staff sign in" /><Link href="/" className="wordmark"><Wordmark /></Link><h1>STAFF SIGN IN</h1><p>Administration access for the portfolio demo.</p>
        <form onSubmit={submit}>
            <label htmlFor="email">Email</label><input id="email" type="email" autoComplete="username" required value={form.data.email} onChange={e => form.setData('email', e.target.value)} aria-describedby={form.errors.email ? 'email-error' : undefined} aria-invalid={!!form.errors.email} />
            {form.errors.email && <p id="email-error" role="alert">{form.errors.email}</p>}
            <label htmlFor="password">Password</label><input id="password" type="password" autoComplete="current-password" required value={form.data.password} onChange={e => form.setData('password', e.target.value)} aria-describedby={form.errors.password ? 'password-error' : undefined} aria-invalid={!!form.errors.password} />
            {form.errors.password && <p id="password-error" role="alert">{form.errors.password}</p>}
            <button disabled={form.processing}>{form.processing ? 'Signing in…' : 'Sign in'}</button>
        </form><Link href="/">Return to storefront</Link>
    </main>;
}
