import { useEffect, useRef, useState } from 'react';
import { parseNames } from './game';

const storageKey = 'den-luot-ai.sessions';

export default function SessionManager({ onPlay, onClose }) {
  const [sessions, setSessions] = useState([]);
  const [draft, setDraft] = useState(null);
  const heading = useRef(null);

  useEffect(() => {
    heading.current.focus();
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) || '[]');
      if (Array.isArray(saved)) setSessions(saved.filter(item =>
        typeof item?.id === 'string' && typeof item.title === 'string' && typeof item.names === 'string'
      ));
    } catch {
      // An invalid or inaccessible store starts with an empty list.
    }
  }, []);

  function save(next) {
    setSessions(next);
    try {
      localStorage.setItem(storageKey, JSON.stringify(next));
    } catch {
      // The current page can still use the session.
    }
  }

  function saveDraft(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const title = form.elements.title.value.trim();
    const names = parseNames(form.elements.names.value);
    if (!title || !names.length) {
      const field = title ? form.elements.names : form.elements.title;
      field.setCustomValidity(title ? 'Hãy nhập ít nhất một tên.' : 'Hãy đặt tên cho ván.');
      field.reportValidity();
      return;
    }

    const session = { id: draft.id || crypto.getRandomValues(new Uint32Array(4)).join('-'), title, names: names.join('\n') };
    save(draft.id ? sessions.map(item => item.id === session.id ? session : item) : [...sessions, session]);
    setDraft(null);
  }

  function remove(session) {
    if (window.confirm(`Xóa ván “${session.title}”?`)) {
      save(sessions.filter(item => item.id !== session.id));
    }
  }

  return (
    <section className="panel scoreboard manager" aria-labelledby="panel-title">
      <div className="panel-heading">
        <h2 id="panel-title" tabIndex={-1} ref={heading}>Quản lý ván</h2>
        <button className="btn btn--secondary" type="button" onClick={onClose}>Quay lại</button>
      </div>
      {draft ? (
        <form key={draft.id || 'new'} onSubmit={saveDraft}>
          <label htmlFor="session-title">Tên ván</label>
          <input id="session-title" name="title" defaultValue={draft.title} required onInput={event => event.currentTarget.setCustomValidity('')} />
          <label htmlFor="session-names">Danh sách học sinh, mỗi tên một dòng</label>
          <textarea id="session-names" name="names" defaultValue={draft.names} rows={5} required onInput={event => event.currentTarget.setCustomValidity('')} />
          <button className="btn btn--primary" type="submit">Lưu ván</button>
          <button className="btn btn--secondary edit-list" type="button" onClick={() => setDraft(null)}>Hủy</button>
        </form>
      ) : (
        <>
          {sessions.length ? (
            <ul className="session-list">
              {sessions.map(session => (
                <li key={session.id}>
                  <p><strong>{session.title}</strong><br /><small>{parseNames(session.names).length} học sinh</small></p>
                  <div className="actions">
                    <button className="btn btn--primary" type="button" onClick={() => onPlay(session.names)}>Chơi</button>
                    <button className="btn btn--secondary" type="button" onClick={() => setDraft(session)}>Sửa</button>
                    <button className="btn btn--secondary" type="button" aria-label={`Xóa ván ${session.title}`} onClick={() => remove(session)}>Xóa</button>
                  </div>
                </li>
              ))}
            </ul>
          ) : <p className="hint">Chưa có ván nào được lưu.</p>}
          <button className="btn btn--primary" type="button" onClick={() => setDraft({ title: '', names: '' })}>Tạo ván</button>
          <details className="instructions">
            <summary>Hướng dẫn</summary>
            <p>Dán danh sách lớp, chọn số tên cần gọi và bấm Bắt đầu. Game tự cào. Bấm Space để tạm dừng hoặc tiếp tục.</p>
          </details>
        </>
      )}
    </section>
  );
}
