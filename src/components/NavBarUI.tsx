'use client';

import { useUser } from '@auth0/nextjs-auth0/client';

export default function NavBarUI() {
  const { user, error, isLoading } = useUser();

  if (isLoading) return <div>Yükleniyor...</div>;
  if (error) return <div>{error.message}</div>;

  return (
    <nav>
      {/* Kullanıcı giriş yapmışsa */}
      {user ? (
        <div>
          <span>Hoş geldin, {user.name}</span>
          <a href="/api/auth/logout">Çıkış Yap</a>
        </div>
      ) : (
        <a href="/api/auth/login">Giriş Yap</a>
      )}
    </nav>
  );
}