import type { User, SessionUser } from "../types/auth";

const USERS_KEY = "users";
const SESSION_KEY = "session";

export function getUsers(): User[] {
  try {
    const users = localStorage.getItem(USERS_KEY);
    if (users) {
      return JSON.parse(users);
    }
    return [];
  } catch (error) {
    console.error("Error parsing users from localStorage:", error);
    return [];
  }
}

export function registerUser(user: { name: string; email: string; password: string }): { ok: boolean; message?: string } {
  const users = getUsers();
  if (users.some((u: User) => u.email === user.email.trim().toLowerCase())) {
    return {ok: false, message: "User with this email already exists."};
}
  const userToSave = { ...user,name: user.name.trim(), email: user.email.trim().toLowerCase(), id: crypto.randomUUID() }; // Generate a unique ID for the user
  users.push(userToSave);
  try {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  } catch (error) {
    return {ok: false, message: error instanceof Error ? error.message : "Error saving user to localStorage."};
  }
  return {ok: true};
}

export function loginUser(email: string, password: string): SessionUser | null {
  try {
    const users = getUsers();
    const user = users.find(
      (u: User) =>
        u.email === email.trim().toLowerCase() && u.password === password,
    );
    if(user === undefined) {
        return null;
    }
    return { id: user.id, name: user.name, email: user.email };
  } catch (error) {
    console.error("Error logging in user from localStorage:", error);
    return null;
  }
}

export function saveSession(user: SessionUser) {
  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify(user));
  } catch (error) {
    console.error("Error saving session to localStorage:", error);
    return {ok: false, message: error instanceof Error ? error.message : "Error saving session to localStorage."};
  }
}

export function getSession(): SessionUser | null {
  try {
    const session = localStorage.getItem(SESSION_KEY);
    if (session) {
      return JSON.parse(session);
    }
    return null;
  } catch (error) {
    console.error("Error parsing session from localStorage:", error);
    return null;
  }
}

export function clearSession() {
  try {
    localStorage.removeItem(SESSION_KEY);
  } catch (error) {
    console.error("Error clearing session from localStorage:", error);
  }
}
