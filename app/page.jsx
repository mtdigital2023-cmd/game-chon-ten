'use client';

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createRound, parseNames } from './game';
import { applyFoil } from './scratch';

const storageKey = 'den-luot-ai.players';

function ScratchTicket({ ticket, index, onReveal }) {
  const canvas = useRef(null);
  const reveal = useCallback(() => onReveal(index), [index, onReveal]);

  useLayoutEffect(() => {
    if (canvas.current) return applyFoil(canvas.current, reveal);
  }, [reveal]);

  return (
    <article className="ticket" data-result={ticket.open ? (ticket.hit ? 'hit' : 'miss') : undefined}>
      <p className="ticket-title">Phiếu {index + 1}</p>
      <div className="scratch">
        <div className="ticket-result" aria-hidden={!ticket.open}>
          <strong>{ticket.name}</strong>
          {ticket.open && <span>{ticket.hit ? 'Đúng tên!' : 'Ngoài danh sách'}</span>}
        </div>
        {!ticket.open && (
          <>
            <canvas ref={canvas} width="320" height="96" aria-hidden="true" />
            <i className="coin" aria-hidden="true" />
          </>
        )}
      </div>
      {!ticket.open && (
        <button className="btn btn--secondary open-ticket" type="button" onClick={reveal}>Mở phiếu {index + 1}</button>
      )}
    </article>
  );
}

export default function Game() {
  const [names, setNames] = useState('');
  const [game, setGame] = useState(null);
  const targetInput = useRef(null);
  const namesInput = useRef(null);
  const ticketList = useRef(null);
  const nextButton = useRef(null);
  const editButton = useRef(null);
  const focusPending = useRef(false);

  useEffect(() => {
    try {
      setNames(localStorage.getItem(storageKey) || '');
    } catch {
      // Playing still works when storage is unavailable.
    }
  }, []);

  useEffect(() => {
    if (!focusPending.current) return;
    focusPending.current = false;
    const target = game
      ? ticketList.current.querySelector('button') || (nextButton.current.disabled ? editButton.current : nextButton.current)
      : namesInput.current;
    target.focus({ preventScroll: true });
  }, [game]);

  const revealTicket = useCallback(index => {
    focusPending.current = true;
    setGame(current => {
      const ticket = current?.tickets[index];
      if (!ticket || ticket.open) return current;

      const tickets = current.tickets.map((item, position) =>
        position === index ? { ...item, open: true } : item
      );
      const selected = ticket.hit ? [...current.selected, ticket.name] : current.selected;
      const finished = tickets.every(item => item.open) && selected.length === current.goal;
      const outcome = ticket.hit ? 'Đúng tên!' : 'Ngoài danh sách.';
      return {
        ...current,
        tickets,
        selected,
        status: `Phiếu ${index + 1}: ${ticket.name} · ${outcome}${finished ? ' Đã chọn đủ số tên.' : ''}`,
      };
    });
  }, []);

  function startGame(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const players = parseNames(names);
    const goal = Number(form.get('target'));
    const count = Number(form.get('count'));

    if (!players.length) {
      namesInput.current.setCustomValidity('Hãy nhập ít nhất một tên.');
      namesInput.current.reportValidity();
      return;
    }
    if (goal > players.length) {
      targetInput.current.setCustomValidity(`Danh sách có ${players.length} tên khác nhau. Hãy giảm mục tiêu hoặc thêm người chơi.`);
      targetInput.current.reportValidity();
      return;
    }

    const cleanNames = players.join('\n');
    setNames(cleanNames);
    try {
      localStorage.setItem(storageKey, cleanNames);
    } catch {
      // The player list remains available for this visit.
    }
    focusPending.current = true;
    setGame({
      players, goal, count, round: 1, selected: [], status: 'Cào hết phiếu để tiếp tục.',
      ...createRound(players, players, goal, count),
    });
  }

  function nextRound() {
    focusPending.current = true;
    setGame({
      ...game,
      ...createRound(game.players, game.remaining, game.goal, game.count),
      round: game.round + 1,
      status: 'Cào hết phiếu để tiếp tục.',
    });
  }

  return (
    <main className="layout hero" data-enter data-playing={Boolean(game)}>
      <a className="skip" href="#panel-title">Đến phần chơi</a>
      <div className="scene-art" data-visual aria-hidden="true" />
      <header className="scene">
        <div className="scene-title">
          <p className="eyebrow">Trò chơi gọi tên</p>
          <h1>Cào tên<br /> ở quán trà</h1>
        </div>
      </header>
      <section className="panel" aria-labelledby="panel-title">
        <h2 id="panel-title" tabIndex={-1}>{game ? `Phiếu trà đá · Lượt ${game.round}` : 'Thiết lập ván chơi'}</h2>
        <form onSubmit={startGame} hidden={Boolean(game)}>
          <label htmlFor="target">Số tên muốn chọn</label>
          <input id="target" name="target" ref={targetInput} type="number" min="1" step="1" defaultValue="1" required aria-describedby="target-hint" onChange={event => event.target.setCustomValidity('')} />
          <p className="hint" id="target-hint">Ván kết thúc khi cào trúng đủ số tên này.</p>
          <label htmlFor="names">Danh sách người chơi</label>
          <p className="hint" id="names-hint">Nhập họ tên, mỗi người một dòng.</p>
          <textarea id="names" ref={namesInput} value={names} rows="5" placeholder={'Nguyễn Minh Anh\nTrần Gia Huy\nLê Bảo Ngọc'} aria-describedby="names-hint" required onChange={event => {
            event.target.setCustomValidity('');
            targetInput.current.setCustomValidity('');
            setNames(event.target.value);
          }} />
          <label htmlFor="count">Số thẻ mỗi lượt</label>
          <select id="count" name="count" defaultValue="1">
            <option value="1">1 thẻ</option>
            <option value="2">2 thẻ</option>
            <option value="3">3 thẻ</option>
          </select>
          <button className="btn btn--primary" type="submit">Bắt đầu</button>
        </form>
        {game && (
          <>
            <p className="hint" id="instructions">Kéo chuột hoặc vuốt lên ô bạc để cào. Chỉ tên trong danh sách mới được tính.</p>
            <label id="progress" htmlFor="game-progress">Đã chọn {game.selected.length}/{game.goal} tên</label>
            <progress id="game-progress" value={game.selected.length} max={game.goal} />
            <div id="cards" key={game.round} ref={ticketList} aria-describedby="instructions">
              {game.tickets.map((ticket, index) => (
                <ScratchTicket key={`${game.round}-${index}`} ticket={ticket} index={index} onReveal={revealTicket} />
              ))}
            </div>
            <p id="status" role="status">{game.status}</p>
            <div className="actions">
              <button className="btn btn--primary" ref={nextButton} type="button" disabled={game.tickets.some(ticket => !ticket.open) || game.selected.length === game.goal} onClick={nextRound}>Lượt tiếp theo</button>
              <button className="btn btn--secondary" ref={editButton} type="button" onClick={() => {
                focusPending.current = true;
                setGame(null);
              }}>Thiết lập lại</button>
            </div>
            <h3>Đã được gọi</h3>
            {game.selected.length === 0
              ? <p className="hint">Chưa có tên trúng.</p>
              : <ol id="history">{game.selected.map(name => <li key={name}>{name}</li>)}</ol>}
          </>
        )}
      </section>
    </main>
  );
}
