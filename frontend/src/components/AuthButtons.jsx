import { useAuth } from "../auth/AuthProvider";

export default function AuthButtons() {
  const { user, token, signIn, signOut } = useAuth();
  return (
    <div className="flex gap-2 items-center">
      {user ? (
        <>
          <span>{user.email}</span>
          <button onClick={signOut}>Sign out</button>
        </>
      ) : (
        <button onClick={signIn}>Sign in with Google</button>
      )}
      <small>{token ? "token ready" : "no token"}</small>
    </div>
  );
}

