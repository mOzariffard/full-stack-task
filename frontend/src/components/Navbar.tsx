'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '../context/AuthContext';
import { AuthModal } from './AuthModal';

export function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'login' | 'register'>('login');

  const openLogin = () => { setModalMode('login'); setShowModal(true); };
  const openRegister = () => { setModalMode('register'); setShowModal(true); };

  return (
    <>
      <header className="navbar">
        <div className="navbar__inner">
          <Link href="/" className="navbar__logo">
            ⚡ <span>DropSystem</span>
          </Link>

          <nav className="navbar__nav">
            <Link href="/" className="navbar__link">Drops</Link>
            {isAuthenticated && (
              <Link href="/my-reservations" className="navbar__link">My Reservations</Link>
            )}
          </nav>

          <div className="navbar__actions">
            {isAuthenticated ? (
              <>
                <span className="navbar__user">👤 {user?.name}</span>
                <button className="btn btn-ghost btn--sm" onClick={logout}>Sign out</button>
              </>
            ) : (
              <>
                <button className="btn btn-ghost btn--sm" onClick={openLogin}>Sign in</button>
                <button className="btn btn-primary btn--sm" onClick={openRegister}>Register</button>
              </>
            )}
          </div>
        </div>
      </header>

      {showModal && (
        <AuthModal initialMode={modalMode} onClose={() => setShowModal(false)} />
      )}
    </>
  );
}
