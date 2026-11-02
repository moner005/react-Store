import { useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { Link } from 'react-router-dom';

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
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) {
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
    const [submitted, setSubmitted] = useState(false);

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
        setSubmitted(false);
    }

    function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        const validationErrors = validate(values, acceptedTerms);

        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            return;
        }

        setErrors({});
        setSubmitted(true);
    }

    return (
        <section
            className="register-page"
            aria-labelledby="register-title"
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
                poster="/assets/Register.png"
                aria-hidden="true"
                style={{
                    position: 'absolute',
                    inset: 0,
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                }}
            >
                <source src="/assets/Register.mp4" type="video/mp4" />
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
                <p className="eyebrow">Create your account</p>
                <h1 id="register-title">Join React Store</h1>
                <p>
                    Register to save your details and make shopping easier.
                </p>

                {submitted ? (
                    <div className="notice" role="status">
                        <strong>Registration details are valid.</strong>
                        Your account will be created when the authentication service is connected.
                    </div>
                ) : null}

                <form onSubmit={handleSubmit} noValidate>
                    <div>
                        <label htmlFor="register-name">Full name</label>
                        <input
                            id="register-name"
                            name="name"
                            type="text"
                            autoComplete="name"
                            value={values.name}
                            onChange={handleChange}
                            aria-invalid={Boolean(errors.name)}
                            aria-describedby={errors.name ? 'register-name-error' : undefined}
                        />
                        {errors.name ? <p id="register-name-error" role="alert">{errors.name}</p> : null}
                    </div>

                    <div>
                        <label htmlFor="register-email">Email address</label>
                        <input
                            id="register-email"
                            name="email"
                            type="email"
                            autoComplete="email"
                            value={values.email}
                            onChange={handleChange}
                            aria-invalid={Boolean(errors.email)}
                            aria-describedby={errors.email ? 'register-email-error' : undefined}
                        />
                        {errors.email ? <p id="register-email-error" role="alert">{errors.email}</p> : null}
                    </div>

                    <div>
                        <label htmlFor="register-password">Password</label>
                        <input
                            id="register-password"
                            name="password"
                            type="password"
                            autoComplete="new-password"
                            value={values.password}
                            onChange={handleChange}
                            aria-invalid={Boolean(errors.password)}
                            aria-describedby={errors.password ? 'register-password-error' : undefined}
                        />
                        {errors.password ? <p id="register-password-error" role="alert">{errors.password}</p> : null}
                    </div>

                    <div>
                        <label htmlFor="register-confirm-password">Confirm password</label>
                        <input
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
                            <p id="register-confirm-password-error" role="alert">{errors.confirmPassword}</p>
                        ) : null}
                    </div>

                    <div>
                        <label>
                            <input
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
                        {errors.terms ? <p id="register-terms-error" role="alert">{errors.terms}</p> : null}
                    </div>

                    <button className="button primary" type="submit">Create account</button>
                </form>

                <p>
                    Already have an account? <Link to="/login">Log in</Link>
                </p>
            </div>
        </section>
    );
}