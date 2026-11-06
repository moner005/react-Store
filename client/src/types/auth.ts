export interface User {
    id: string,
    name: string,
    email: string,
    password: string,
    // role: 'user' | 'admin',
    // token: string
}

export type SessionUser = Omit<User, 'password'>