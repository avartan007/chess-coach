import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

const inputStyle = {
  background: 'rgba(24,16,12,0.8)',
  border: '1px solid rgba(226,125,56,0.22)',
  borderRadius: 12,
  padding: '14px 16px',
  fontSize: 14,
  color: '#F7EFE4',
  outline: 'none',
  width: '100%',
  boxSizing: 'border-box',
  fontFamily: "'Plus Jakarta Sans', sans-serif",
  transition: 'border-color 0.2s',
};

const inputFocusStyle = {
  borderColor: 'rgba(226,125,56,0.65)',
};

function InputField({ style, onFocus, onBlur, ...rest }) {
  const [focused, setFocused] = useState(false);
  return (
    <input
      style={{ ...inputStyle, ...(focused ? inputFocusStyle : {}), ...style }}
      onFocus={e => { setFocused(true); onFocus && onFocus(e); }}
      onBlur={e => { setFocused(false); onBlur && onBlur(e); }}
      {...rest}
    />
  );
}

function SelectField({ style, onFocus, onBlur, children, ...rest }) {
  const [focused, setFocused] = useState(false);
  return (
    <select
      style={{ ...inputStyle, ...(focused ? inputFocusStyle : {}), ...style, cursor: 'pointer' }}
      onFocus={e => { setFocused(true); onFocus && onFocus(e); }}
      onBlur={e => { setFocused(false); onBlur && onBlur(e); }}
      {...rest}
    >
      {children}
    </select>
  );
}

const Spinner = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    style={{ animation: 'spin 0.8s linear infinite', display: 'inline-block', marginRight: 8, verticalAlign: 'middle' }}
  >
    <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    <circle cx="12" cy="12" r="9" stroke="rgba(255,255,255,0.25)" strokeWidth="2.5" />
    <path d="M12 3 A9 9 0 0 1 21 12" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" />
  </svg>
);

export default function SetupCard({ onStart }) {
  const [username, setUsername] = useState('');
  const [count, setCount] = useState(10);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [cachedUsername, setCachedUsername] = useState(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('chess_coach_cached_session');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && parsed.username) {
          setCachedUsername(parsed.username);
        }
      }
    } catch {
      // ignore
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim()) {
      setError('Please enter a Chess.com username.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await onStart({ username: username.trim(), count: Number(count) });
    } catch (err) {
      setError(err?.message || 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResume = async () => {
    setError('');
    setLoading(true);
    try {
      await onStart({ fromCache: true });
    } catch (err) {
      setError(err?.message || 'Could not resume session.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="glass"
      style={{
        borderRadius: 20,
        padding: 44,
        maxWidth: 440,
        width: '100%',
        boxSizing: 'border-box',
      }}
    >
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            marginBottom: 8,
          }}
        >
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: 'rgba(226,125,56,0.13)',
              border: '1px solid rgba(226,125,56,0.28)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 18,
            }}
          >
            ♟
          </div>
          <h2
            style={{
              fontFamily: "'Outfit', sans-serif",
              fontWeight: 700,
              fontSize: 22,
              color: '#F7EFE4',
              margin: 0,
              letterSpacing: '-0.4px',
            }}
          >
            Analyze New Account
          </h2>
        </div>
        <p
          style={{
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontSize: 14,
            color: '#BAA28C',
            margin: 0,
            lineHeight: 1.5,
          }}
        >
          Enter your Chess.com username to begin deep analysis
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
          <label
            style={{
              display: 'block',
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontSize: 12,
              fontWeight: 600,
              color: '#BAA28C',
              marginBottom: 8,
              letterSpacing: '0.5px',
              textTransform: 'uppercase',
            }}
          >
            Chess.com Username
          </label>
          <InputField
            type="text"
            placeholder="e.g. Magnus_Carlsen"
            value={username}
            onChange={e => setUsername(e.target.value)}
            autoComplete="off"
            spellCheck={false}
          />
        </div>

        <div>
          <label
            style={{
              display: 'block',
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontSize: 12,
              fontWeight: 600,
              color: '#BAA28C',
              marginBottom: 8,
              letterSpacing: '0.5px',
              textTransform: 'uppercase',
            }}
          >
            Games to Analyze
          </label>
          <SelectField
            value={count}
            onChange={e => setCount(e.target.value)}
          >
            <option value={1}>1 game</option>
            <option value={5}>5 games</option>
            <option value={10}>10 games</option>
            <option value={20}>20 games</option>
          </SelectField>
        </div>

        {/* Error */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              background: 'rgba(184,60,36,0.10)',
              border: '1px solid rgba(184,60,36,0.25)',
              borderRadius: 10,
              padding: '12px 14px',
              color: '#e88670',
              fontSize: 13,
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              lineHeight: 1.5,
            }}
          >
            ⚠ {error}
          </motion.div>
        )}

        {/* Submit */}
        <button
          type="submit"
          className="btn-primary"
          disabled={loading}
          style={{
            width: '100%',
            marginTop: 4,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: loading ? 0.8 : 1,
            cursor: loading ? 'not-allowed' : 'pointer',
          }}
        >
          {loading ? (
            <>
              <Spinner />
              Syncing Engine...
            </>
          ) : (
            'Start Engine Sync →'
          )}
        </button>

        {/* Resume Session */}
        {cachedUsername && (
          <button
            type="button"
            className="btn-secondary"
            onClick={handleResume}
            disabled={loading}
            style={{
              width: '100%',
              opacity: loading ? 0.6 : 1,
              cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: 13,
            }}
          >
            Resume Session ({cachedUsername})
          </button>
        )}
      </form>

      {/* Info note */}
      <p
        style={{
          marginTop: 20,
          fontSize: 11.5,
          color: '#7A5E4B',
          fontFamily: "'Plus Jakarta Sans', sans-serif",
          textAlign: 'center',
          lineHeight: 1.6,
        }}
      >
        Analysis powered by Stockfish 16 · depth-14 · No sign-up required
      </p>
    </motion.div>
  );
}
