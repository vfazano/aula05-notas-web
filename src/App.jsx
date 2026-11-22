import { useEffect, useState } from 'react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const emptyForm = { titulo: '', texto: '' };

export default function App() {
  const [notes, setNotes] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  async function request(path = '/api/notes', options = {}) {
    const response = await fetch(`${API_URL}${path}`, {
      ...options,
      headers: { ...(options.body ? { 'Content-Type': 'application/json' } : {}), ...options.headers }
    });
    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      throw new Error(body.error || `Erro HTTP ${response.status}`);
    }
    return response.status === 204 ? null : response.json();
  }

  async function loadNotes() {
    setLoading(true);
    try { setNotes(await request()); setError(''); }
    catch (loadError) { setError(loadError.message); }
    finally { setLoading(false); }
  }

  useEffect(() => { loadNotes(); }, []);

  async function handleSubmit(event) {
    event.preventDefault();
    if (!form.titulo.trim() || !form.texto.trim()) {
      setError('Preencha o título e o texto para salvar.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const path = editingId ? `/api/notes/${encodeURIComponent(editingId)}` : '/api/notes';
      await request(path, { method: editingId ? 'PUT' : 'POST', body: JSON.stringify(form) });
      setForm(emptyForm);
      setEditingId(null);
      await loadNotes();
    } catch (saveError) { setError(saveError.message); }
    finally { setSaving(false); }
  }

  function startEditing(note) {
    setForm({ titulo: note.titulo, texto: note.texto });
    setEditingId(note.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function deleteNote(note) {
    if (!window.confirm(`Excluir a nota “${note.titulo}”?`)) return;
    try { await request(`/api/notes/${encodeURIComponent(note.id)}`, { method: 'DELETE' }); await loadNotes(); }
    catch (deleteError) { setError(deleteError.message); }
  }

  function cancelEdit() { setForm(emptyForm); setEditingId(null); }

  return (
    <main className="workspace">
      <header className="masthead">
        <a className="brand" href="#inicio" aria-label="Caderno, início"><span className="brand-mark">C.</span><span>caderno<span className="brand-period">/</span></span></a>
        <span className="course-tag">PROJETO API · AULA 05</span>
      </header>
      <section className="intro" id="inicio">
        <div><p className="kicker">SEU ESPAÇO DE IDEIAS</p><h1>Notas que<br /><i>ficam.</i></h1></div>
        <p className="intro-copy">Um caderno conectado à API Express. Crie, releia, edite e deixe ir.</p>
      </section>
      <div className="columns">
        <section className="editor" aria-labelledby="editor-title">
          <div className="section-heading"><span>01</span><h2 id="editor-title">{editingId ? 'Editar nota' : 'Nova nota'}</h2></div>
          <form onSubmit={handleSubmit}>
            <label htmlFor="titulo">Título</label>
            <input id="titulo" maxLength="90" value={form.titulo} onChange={(event) => setForm({ ...form, titulo: event.target.value })} placeholder="Uma ideia para não esquecer" required />
            <label htmlFor="texto">Anotação</label>
            <textarea id="texto" rows="6" value={form.texto} onChange={(event) => setForm({ ...form, texto: event.target.value })} placeholder="Escreva do seu jeito..." required />
            {error && <p className="form-error" role="alert">{error}</p>}
            <div className="form-actions">
              {editingId && <button className="text-button" type="button" onClick={cancelEdit}>Cancelar</button>}
              <button className="save-button" type="submit" disabled={saving}>{saving ? 'Salvando...' : editingId ? 'Salvar edição' : 'Guardar nota'} <span aria-hidden="true">↗</span></button>
            </div>
          </form>
          <p className="api-caption"><span className="status-dot" /> API {API_URL}</p>
        </section>
        <section className="notes-section" aria-labelledby="notes-title">
          <div className="section-heading"><span>02</span><h2 id="notes-title">Seu arquivo <small>{notes.length.toString().padStart(2, '0')}</small></h2><button className="reload" type="button" onClick={loadNotes} aria-label="Atualizar lista" title="Atualizar lista">↻</button></div>
          {loading ? <p className="empty-state">Buscando suas notas...</p> : notes.length === 0 ? <p className="empty-state">Ainda está em branco.<br />Sua primeira nota pode começar aqui.</p> : <div className="notes-list">{notes.map((note) => <article className="note" key={note.id}>
            <div className="note-meta"><time dateTime={note.criadoEm}>{new Date(note.criadoEm).toLocaleDateString('pt-BR')}</time><span>#{note.id.slice(-4)}</span></div>
            <h3>{note.titulo}</h3><p className="note-text">{note.texto}</p>
            <div className="note-actions"><button type="button" onClick={() => startEditing(note)}>Editar</button><button type="button" onClick={() => deleteNote(note)}>Excluir</button></div>
          </article>)}</div>}
        </section>
      </div>
      <footer className="footer"><span>CRUD · JSON · EXPRESS</span><span>Dados locais em data.json</span></footer>
    </main>
  );
}
