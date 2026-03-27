import { useState, useEffect } from 'react';
import api from '../api/axios.js';

const NotesSection = ({ entityType, entityId }) => {
  const [notes, setNotes] = useState([]);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchNotes = async () => {
    try {
      const res = await api.get(`/notes/${entityType}/${entityId}`);
      setNotes(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotes();
  }, [entityType, entityId]);

  const handleAdd = async () => {
    if (!content.trim()) return;
    setSaving(true);
    try {
      const res = await api.post(`/notes/${entityType}/${entityId}`, { content });
      setNotes(prev => [res.data, ...prev]);
      setContent('');
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Usunąć tę notatkę?')) return;
    try {
      await api.delete(`/notes/${id}`);
      setNotes(prev => prev.filter(n => n.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('pl-PL', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="card" style={{ marginTop: 24 }}>
      <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>
        Notatki {notes.length > 0 && (
          <span style={{
            background: '#f3f4f6',
            color: '#6b7280',
            borderRadius: 99,
            padding: '1px 8px',
            fontSize: 12,
            fontWeight: 600,
            marginLeft: 8,
          }}>
            {notes.length}
          </span>
        )}
      </h2>

      {/* Dodaj notatkę */}
      <div style={{ marginBottom: 20 }}>
        <textarea
          value={content}
          onChange={e => setContent(e.target.value)}
          placeholder="Dodaj notatkę..."
          rows={3}
          style={{ marginBottom: 8, resize: 'vertical' }}
          onKeyDown={e => {
            if (e.key === 'Enter' && e.ctrlKey) handleAdd();
          }}
        />
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            className="btn-primary"
            onClick={handleAdd}
            disabled={saving || !content.trim()}
          >
            {saving ? 'Zapisywanie...' : 'Dodaj notatkę'}
          </button>
          <span style={{ fontSize: 12, color: '#9ca3af' }}>
            lub Ctrl + Enter
          </span>
        </div>
      </div>

      {/* Lista notatek */}
      {loading ? (
        <div style={{ color: '#6b7280', textAlign: 'center', padding: 16 }}>Ładowanie...</div>
      ) : notes.length === 0 ? (
        <div style={{ color: '#9ca3af', textAlign: 'center', padding: 16, fontSize: 13 }}>
          Brak notatek
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {notes.map(note => (
            <div key={note.id} style={{
              background: '#fafafa',
              border: '1px solid #e5e7eb',
              borderLeft: '3px solid #2563eb',
              borderRadius: 6,
              padding: '10px 14px',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                <div style={{ fontSize: 13, lineHeight: 1.6, flex: 1, whiteSpace: 'pre-wrap' }}>
                  {note.content}
                </div>
                <button
                  onClick={() => handleDelete(note.id)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#9ca3af',
                    cursor: 'pointer',
                    fontSize: 16,
                    padding: '0 4px',
                    lineHeight: 1,
                    flexShrink: 0,
                  }}
                  title="Usuń notatkę"
                >
                  ×
                </button>
              </div>
              <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 6 }}>
                {formatDate(note.created_at)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default NotesSection;