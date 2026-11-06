import { useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
const DASHBOARD_ROUTE = '/dashboard';
const REGISTER_ROUTE = '/register';


type LoginValues = {
    email: string;
    password: string;
};

type LoginErrors = Partial<Record<keyof LoginValues, string>>;

const initialValues: LoginValues = {
    email: '',
    password: '',
};

function validate(values: LoginValues): LoginErrors {
    const errors: LoginErrors = {};

    if (!values.email.trim()) {
        errors.email = 'Please enter your email address.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) {
        errors.email = 'Please enter a valid email address.';
    }

    if (!values.password) {
        errors.password = 'Please enter your password.';
    }

    return errors;
}

export default function LoginPage() {
    const [values, setValues] = useState(initialValues);
    const [errors, setErrors] = useState<LoginErrors>({});
    const [submitted, setSubmitted] = useState(false);
    const navigate = useNavigate();
    const login = useAuthStore((state) => state.login);

    function handleChange({ target }: ChangeEvent<HTMLInputElement>) {
        const { name, value } = target;
        setValues((currentValues) => ({
            ...currentValues,
            [name]: value,
        }));
        setErrors((currentErrors) => ({
            ...currentErrors,
            [name]: undefined,
        }));
        setSubmitted(false);
    }

    function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        const validationErrors = validate(values);

        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            return;
        }

        const isLoginSuccessful = login(values.email, values.password);
        if (!isLoginSuccessful) {
            setErrors({ password: 'Invalid email or password.' });
            return;
        }
        setErrors({});
        navigate(DASHBOARD_ROUTE);
    }

    return (
        <section
            className="login-page relative grid min-h-screen place-items-center overflow-hidden px-4 py-6"
            aria-labelledby="login-title"
        >
            <video
                className="absolute inset-0 h-full w-full object-cover"
                autoPlay
                loop
                muted
                playsInline
                poster="/assets/Login.png"
                aria-hidden="true"
            >
                <source src="/assets/Login.mp4" type="video/mp4" />
            </video>
            <div className="absolute inset-0 z-0 bg-slate-950/50" aria-hidden="true" />
            <div className="relative z-10 w-full max-w-lg rounded-2xl border border-white/40 bg-white/20 p-6 shadow-2xl backdrop-blur-xl sm:p-10">
                <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-emerald-100">Welcome back</p>
                <h1 id="login-title" className="mb-3 text-3xl font-bold tracking-tight text-white sm:text-4xl">Log in to React Store</h1>
                <p className="mb-8 leading-7 text-white/85">
                    Sign in to manage your account and continue shopping.
                </p>

                {submitted ? (
                    <div className="mb-6 rounded-lg border-l-4 border-amber-500 bg-amber-50 p-4 text-sm leading-6 text-amber-900" role="status">
                        <strong className="block text-amber-950">Login details are valid.</strong>
                        You will be signed in when the authentication service is connected.
                    </div>
                ) : null}

                <form className="space-y-5" onSubmit={handleSubmit} noValidate>
                    <div className="space-y-2">
                        <label className="block text-sm font-semibold text-white" htmlFor="login-email">Email address</label>
                        <input
                            className="w-full rounded-lg border border-white/50 bg-white/80 px-4 py-3 text-slate-900 shadow-sm outline-none transition placeholder:text-slate-500 focus:border-emerald-300 focus:ring-4 focus:ring-emerald-300/30"
                            id="login-email"
                            name="email"
                            type="email"
                            autoComplete="email"
                            value={values.email}
                            onChange={handleChange}
                            aria-invalid={Boolean(errors.email)}
                            aria-describedby={errors.email ? 'login-email-error' : undefined}
                        />
                        {errors.email ? <p className="text-sm text-red-400" id="login-email-error" role="alert">{errors.email}</p> : null}
                    </div>

                    <div className="space-y-2">
                        <label className="block text-sm font-semibold text-white" htmlFor="login-password">Password</label>
                        <input
                            className="w-full rounded-lg border border-white/50 bg-white/80 px-4 py-3 text-slate-900 shadow-sm outline-none transition placeholder:text-slate-500 focus:border-emerald-300 focus:ring-4 focus:ring-emerald-300/30"
                            id="login-password"
                            name="password"
                            type="password"
                            autoComplete="current-password"
                            value={values.password}
                            onChange={handleChange}
                            aria-invalid={Boolean(errors.password)}
                            aria-describedby={errors.password ? 'login-password-error' : undefined}
                        />
                        {errors.password ? (
                            <p className="text-sm text-red-400" id="login-password-error" role="alert">{errors.password}</p>
                        ) : null}
                    </div>

                    <button className="w-full rounded-lg bg-emerald-700 px-5 py-3 font-semibold text-white shadow-sm transition hover:bg-emerald-800 focus:outline-none focus:ring-4 focus:ring-emerald-600/30" type="submit">Log in</button>
                </form>

                <p className="mt-6 text-center text-sm text-white/85">
                    Don&apos;t have an account? <Link className="font-semibold text-emerald-100 hover:text-white hover:underline" to={REGISTER_ROUTE}>Create one</Link>
                </p>
            </div>
        </section>
    );
}