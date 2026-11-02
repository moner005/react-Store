import { useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { Link } from 'react-router-dom';

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

        setErrors({});
        setSubmitted(true);
    }

    return (
        <section
            className="login-page"
            aria-labelledby="login-title"
            style={{
                position: 'relative',
                minHeight: 'calc(100vh - 140px)',
                display: 'grid',
                placeItems: 'center',
                overflow: 'hidden',
                padding: '2rem 1rem',
            }}
        >
            <video
                autoPlay
                loop
                muted
                playsInline
                poster="/assets/Login.png"
                aria-hidden="true"
                style={{
                    position: 'absolute',
                    inset: 0,
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                }}
            >
                <source src="/assets/Login.mp4" type="video/mp4" />
            </video>
            <div
                aria-hidden="true"
                style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'rgba(20, 32, 25, .48)',
                }}
            />
            <div
                className="panel"
                style={{
                    position: 'relative',
                    width: 'min(100%, 760px)',
                    margin: 0,
                    background: 'rgba(255, 255, 255, .94)',
                    backdropFilter: 'blur(6px)',
                }}
            >
                <p className="eyebrow">Welcome back</p>
                <h1 id="login-title">Log in to React Store</h1>
                <p>
                    Sign in to manage your account and continue shopping.
                </p>

                {submitted ? (
                    <div className="notice" role="status">
                        <strong>Login details are valid.</strong>
                        You will be signed in when the authentication service is connected.
                    </div>
                ) : null}

                <form onSubmit={handleSubmit} noValidate>
                    <div>
                        <label htmlFor="login-email">Email address</label>
                        <input
                            id="login-email"
                            name="email"
                            type="email"
                            autoComplete="email"
                            value={values.email}
                            onChange={handleChange}
                            aria-invalid={Boolean(errors.email)}
                            aria-describedby={errors.email ? 'login-email-error' : undefined}
                        />
                        {errors.email ? <p id="login-email-error" role="alert">{errors.email}</p> : null}
                    </div>

                    <div>
                        <label htmlFor="login-password">Password</label>
                        <input
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
                            <p id="login-password-error" role="alert">{errors.password}</p>
                        ) : null}
                    </div>

                    <button className="button primary" type="submit">Log in</button>
                </form>

                <p>
                    Don&apos;t have an account? <Link to="/register">Create one</Link>
                </p>
            </div>
        </section>
    );
}
