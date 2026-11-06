import { registerUser } from '@/services/authStorage';
import { useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { routes }from '@/constants/routes';

type RegistrationValues = {
    name: string;
    email: string;
    password: string;
    confirmPassword: string;
};

type RegistrationErrors = Partial<Record<keyof RegistrationValues | 'terms', string>>;

const initialValues: RegistrationValues = {
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
};

function validate(values: RegistrationValues, acceptedTerms: boolean): RegistrationErrors {
    const errors: RegistrationErrors = {};

    if (!values.name.trim()) {
        errors.name = 'Please enter your name.';
    }

    if (!values.email.trim()) {
        errors.email = 'Please enter your email address.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) {
        errors.email = 'Please enter a valid email address.';
    }

    if (values.password.length < 8) {
        errors.password = 'Password must be at least 8 characters.';
    }

    if (values.confirmPassword !== values.password) {
        errors.confirmPassword = 'Passwords do not match.';
    }

    if (!acceptedTerms) {
        errors.terms = 'Please accept the terms to continue.';
    }

    return errors;
}

export default function RegisterPage() {
    const [values, setValues] = useState(initialValues);
    const [acceptedTerms, setAcceptedTerms] = useState(false);
    const [errors, setErrors] = useState<RegistrationErrors>({});
    const navigate = useNavigate();

    function handleChange({
        target,
    }: ChangeEvent<HTMLInputElement>) {
        const { name, value } = target;
        setValues((currentValues) => ({
            ...currentValues,
            [name]: value,
        }));
        setErrors((currentErrors) => ({
            ...currentErrors,
            [name]: undefined,
        }));
    }

    function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        const validationErrors = validate(values, acceptedTerms);
        
        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            return;
        }
        
        const saveResult = registerUser({ name: values.name.trim(), email: values.email, password: values.password });
        if (!saveResult.ok) {
            setErrors({ email: saveResult.message });
            return;
        }
        setErrors({});
        navigate(routes.login);
    }

    return (
        <section
            className="register-page relative grid min-h-screen place-items-center overflow-hidden px-4 py-3 sm:py-4"
            aria-labelledby="register-title"
        >
            <video
                className="absolute inset-0 h-full w-full object-cover"
                autoPlay
                loop
                muted
                playsInline
                poster="/assets/Register.png"
                aria-hidden="true"
            >
                <source src="/assets/Register.mp4" type="video/mp4" />
            </video>
            <div className="absolute inset-0 bg-slate-950/50" aria-hidden="true" />
            <div className="relative w-full max-w-lg rounded-2xl border border-white/40 bg-white/20 p-4 shadow-2xl backdrop-blur-xl sm:p-5">
                <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-emerald-100">Create your account</p>
                <h1 id="register-title" className="mb-2 text-3xl font-bold tracking-tight text-white sm:text-4xl">Join React Store</h1>
                <p className="mb-3 leading-6 text-white/85">
                    Register to save your details and make shopping easier.
                </p>

                <form className="space-y-2" onSubmit={handleSubmit} noValidate>
                    <div className="space-y-0.5">
                        <label className="block text-sm font-semibold text-white" htmlFor="register-name">Full name</label>
                        <input
                            className="w-full rounded-lg border border-white/50 bg-white/80 px-4 py-2 text-slate-900 shadow-sm outline-none transition focus:border-emerald-300 focus:ring-4 focus:ring-emerald-300/30"
                            id="register-name"
                            name="name"
                            type="text"
                            autoComplete="name"
                            value={values.name}
                            onChange={handleChange}
                            aria-invalid={Boolean(errors.name)}
                            aria-describedby={errors.name ? 'register-name-error' : undefined}
                        />
                        {errors.name ? <p className="text-sm text-red-400" id="register-name-error" role="alert">{errors.name}</p> : null}
                    </div>

                    <div className="space-y-0.5">
                        <label className="block text-sm font-semibold text-white" htmlFor="register-email">Email address</label>
                        <input
                            className="w-full rounded-lg border border-white/50 bg-white/80 px-4 py-2 text-slate-900 shadow-sm outline-none transition focus:border-emerald-300 focus:ring-4 focus:ring-emerald-300/30"
                            id="register-email"
                            name="email"
                            type="email"
                            autoComplete="email"
                            value={values.email}
                            onChange={handleChange}
                            aria-invalid={Boolean(errors.email)}
                            aria-describedby={errors.email ? 'register-email-error' : undefined}
                        />
                        {errors.email ? <p className="text-sm text-red-400" id="register-email-error" role="alert">{errors.email}</p> : null}
                    </div>

                    <div className="space-y-0.5">
                        <label className="block text-sm font-semibold text-white" htmlFor="register-password">Password</label>
                        <input
                            className="w-full rounded-lg border border-white/50 bg-white/80 px-4 py-2 text-slate-900 shadow-sm outline-none transition focus:border-emerald-300 focus:ring-4 focus:ring-emerald-300/30"
                            id="register-password"
                            name="password"
                            type="password"
                            autoComplete="new-password"
                            value={values.password}
                            onChange={handleChange}
                            aria-invalid={Boolean(errors.password)}
                            aria-describedby={errors.password ? 'register-password-error' : undefined}
                        />
                        {errors.password ? <p className="text-sm text-red-400" id="register-password-error" role="alert">{errors.password}</p> : null}
                    </div>

                    <div className="space-y-0.5">
                        <label className="block text-sm font-semibold text-white" htmlFor="register-confirm-password">Confirm password</label>
                        <input
                            className="w-full rounded-lg border border-white/50 bg-white/80 px-4 py-2 text-slate-900 shadow-sm outline-none transition focus:border-emerald-300 focus:ring-4 focus:ring-emerald-300/30"
                            id="register-confirm-password"
                            name="confirmPassword"
                            type="password"
                            autoComplete="new-password"
                            value={values.confirmPassword}
                            onChange={handleChange}
                            aria-invalid={Boolean(errors.confirmPassword)}
                            aria-describedby={errors.confirmPassword ? 'register-confirm-password-error' : undefined}
                        />
                        {errors.confirmPassword ? (
                            <p className="text-sm text-red-400" id="register-confirm-password-error" role="alert">{errors.confirmPassword}</p>
                        ) : null}
                    </div>

                    <div className="space-y-0.5">
                        <label className="flex items-start gap-3 text-sm leading-5 text-white/85">
                            <input
                                className="mt-1 h-4 w-4 rounded border-slate-300 text-emerald-700 focus:ring-emerald-600"
                                name="terms"
                                type="checkbox"
                                checked={acceptedTerms}
                                onChange={(event) => {
                                    setAcceptedTerms(event.target.checked);
                                    setErrors((currentErrors) => ({ ...currentErrors, terms: undefined }));
                                }}
                                aria-invalid={Boolean(errors.terms)}
                                aria-describedby={errors.terms ? 'register-terms-error' : undefined}
                            />
                            I agree to the store terms and privacy policy.
                        </label>
                        {errors.terms ? <p className="text-sm text-red-400" id="register-terms-error" role="alert">{errors.terms}</p> : null}
                    </div>

                    <button className="w-full rounded-lg bg-emerald-700 px-5 py-2.5 font-semibold text-white shadow-sm transition hover:bg-emerald-800 focus:outline-none focus:ring-4 focus:ring-emerald-600/30" type="submit">Create account</button>
                </form>

                <p className="mt-3 text-center text-sm text-white/85">
                    Already have an account? <Link className="font-semibold text-emerald-100 hover:text-white hover:underline" to={routes.login}>Log in</Link>
                </p>
            </div>
        </section>
    );
}