'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { drawTicket, parseNames } from './game';
import { animateScratch } from './scratch';
import { useGameSound } from './sound';
import SessionManager from './sessions';

const storageKey = 'den-luot-ai.players';
const friends = ['Mai', 'An', 'Vy', 'Khang'];
const phaseDuration = { intro: 2300, tear: 1650, place: 810, result: 2000 };
const reducedDuration = { intro: 350, tear: 400, place: 275, result: 1100 };
const nextPhase = { intro: 'tear', tear: 'place', place: 'scratch', result: 'scoreboard' };
const phaseText = {
  intro: 'Hội bạn vào bàn.',
  tear: 'đang xé nhãn chai.',
  place: 'đang đặt vé lên bàn.',
  scratch: 'đang cào lớp bạc.',
};

function Welcome() {
  return (
    <header className="scene">
      <img className="welcome-brand" src="/mt-digital.webp" alt="MT Digital" width={560} height={107} />
      <div className="scene-title">
        <p className="eyebrow">Trò chơi gọi tên</p>
        <h1>Cào tên<br /> ở quán trà</h1>
      </div>
    </header>
  );
}

function TicketBrand() {
  return <span className="ticket-brand"><img src="/mt-digital.webp" alt="MT Digital" /></span>;
}

function QuantityFields({ goal = 1, cards, setCards, max, suffix = '' }) {
  return (
    <div className="quantity-fields">
      <div>
        <label htmlFor={`target${suffix}`}>Số tên muốn chọn</label>
        <input id={`target${suffix}`} name="target" type="number" defaultValue={goal} min={1} max={max} step={1} required onInput={event => event.currentTarget.setCustomValidity('')} />
      </div>
      <fieldset>
        <legend>Số thẻ mỗi lượt</legend>
        <div className="card-count">
          {[1, 3, 5].map(count => (
            <button key={count} className="btn btn--secondary count-option" type="button" onClick={event => {
              event.currentTarget.form.elements.namedItem('cards').setCustomValidity('');
              setCards(String(count));
            }} aria-pressed={cards === String(count)}>
              {count}
            </button>
          ))}
          <input name="cards" type="number" aria-label="Nhập số thẻ mỗi lượt" placeholder="Số khác" value={cards} min={1} step={1} required onChange={event => {
            event.target.setCustomValidity('');
            setCards(event.target.value);
          }} />
        </div>
      </fieldset>
    </div>
  );
}

function readQuantities(form, available) {
  const targetInput = form.elements.namedItem('target');
  const cardsInput = form.elements.namedItem('cards');
  const goal = targetInput.valueAsNumber;
  const cardsPerRound = cardsInput.valueAsNumber;
  if (!Number.isSafeInteger(goal) || goal < 1 || goal > available) {
    targetInput.setCustomValidity(`Danh sách còn ${available} tên có thể chọn.`);
    targetInput.reportValidity();
    return;
  }
  if (!Number.isSafeInteger(cardsPerRound) || cardsPerRound < 1) {
    cardsInput.setCustomValidity('Nhập số thẻ là số nguyên dương.');
    cardsInput.reportValidity();
    return;
  }
  return { goal, cardsPerRound };
}

function TearScene() {
  return (
    <div className="tear-scene" aria-hidden="true">
      <div className="soda-bottle" />
      <div className="peeling-label"><span>COLA</span></div>
    </div>
  );
}

function ScratchTicket({ name, serial, style, paused, onFinish, onStroke }) {
  const canvas = useRef(null);
  const controller = useRef(null);
  const finish = useRef(onFinish);

  useLayoutEffect(() => {
    finish.current = onFinish;
  }, [onFinish]);

  useLayoutEffect(() => {
    const scratch = animateScratch(canvas.current, style, () => finish.current(), onStroke);
    controller.current = scratch;
    return () => scratch.dispose();
  }, [style, onStroke]);

  useEffect(() => {
    if (!paused) controller.current.start();
    return () => controller.current.stop();
  }, [paused]);

  return (
    <div className="playing-ticket">
      <div className="ticket-heading">
        <TicketBrand />
        <span>Vé cào gọi tên <small>Số {serial}</small></span>
      </div>
      <div className="scratch-window" aria-hidden="true">
        <strong>
          {name.split(' ').map((word, index) => <span key={index}>{word}</span>)}
        </strong>
        <canvas ref={canvas} width={520} height={125} />
        <i className="scratch-hand" />
      </div>
    </div>
  );
}

export default function Game() {
  const [names, setNames] = useState('');
  const [managing, setManaging] = useState(false);
  const [cards, setCards] = useState('1');
  const [roster, setRoster] = useState([]);
  const [excluded, setExcluded] = useState([]);
  const [game, setGame] = useState(null);
  const [paused, setPaused] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [canFullscreen, setCanFullscreen] = useState(false);
  const stage = useRef(null);
  const setupInput = useRef(null);
  const returning = useRef(false);
  const heading = useRef(null);
  const phaseClock = useRef(null);
  const phase = game?.phase;
  const playing = Boolean(phase) && phase !== 'scoreboard';
  const sound = useGameSound(phase, paused, game?.ticket.hit);

  useEffect(() => {
    setCanFullscreen(Boolean(document.fullscreenEnabled));
    function trackFullscreen() {
      setFullscreen(document.fullscreenElement === stage.current);
    }
    document.addEventListener('fullscreenchange', trackFullscreen);
    return () => document.removeEventListener('fullscreenchange', trackFullscreen);
  }, []);

  useEffect(() => {
    if (!playing) return;
    function pauseOnSpace(event) {
      if (event.code !== 'Space' || event.repeat || event.altKey || event.ctrlKey || event.metaKey) return;
      if (event.target.closest?.('button, input, select, textarea, a, [contenteditable]')) return;
      event.preventDefault();
      setPaused(value => !value);
    }
    document.addEventListener('keydown', pauseOnSpace);
    return () => document.removeEventListener('keydown', pauseOnSpace);
  }, [playing]);

  async function toggleFullscreen() {
    try {
      if (document.fullscreenElement === stage.current) await document.exitFullscreen();
      else await stage.current.requestFullscreen();
    } catch {
      // Fullscreen can be denied by the browser.
    }
  }

  useEffect(() => {
    try {
      setNames(localStorage.getItem(storageKey) || '');
    } catch {
      // The list can still be entered for this visit.
    }
  }, []);

  useEffect(() => {
    if (phase === 'intro' || phase === 'scoreboard') heading.current?.focus();
    if (!phase && !managing && returning.current) {
      returning.current = false;
      setupInput.current?.focus();
    }
  }, [phase, managing]);

  function startBatch(quantities, players, available) {
    setPaused(false);
    phaseClock.current = null;
    const missesLeft = Math.floor(Math.random() * 4);
    const firstFriend = Math.floor(Math.random() * friends.length);
    const serialStart = Math.floor(Math.random() * 100000);
    setGame({
      ...quantities,
      phase: 'intro',
      attempt: 0,
      remaining: available,
      winners: [],
      missesLeft,
      firstFriend,
      serialStart,
      ticket: drawTicket(players, available, missesLeft, serialStart),
    });
  }

  function startGame(event) {
    event.preventDefault();
    const players = parseNames(names);
    if (!players.length) {
      setupInput.current.setCustomValidity('Hãy nhập ít nhất một tên.');
      setupInput.current.reportValidity();
      return;
    }
    const quantities = readQuantities(event.currentTarget, players.length);
    if (!quantities) return;

    const clean = players.join('\n');
    setNames(clean);
    setRoster(players);
    setExcluded([]);
    try {
      localStorage.setItem(storageKey, clean);
    } catch {
      // The list still works for this visit.
    }
    startBatch(quantities, players, players);
  }

  function finishScratch() {
    setGame(current => {
      if (current.phase !== 'scratch') return current;
      const { hit, name } = current.ticket;
      return {
        ...current,
        phase: 'result',
        remaining: hit ? current.remaining.filter(player => player !== name) : current.remaining,
        winners: hit ? [...current.winners, name] : current.winners,
      };
    });
  }

  useEffect(() => {
    if (!phaseDuration[phase]) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const duration = reduced ? reducedDuration[phase] : phaseDuration[phase];
    if (phaseClock.current?.game !== game) phaseClock.current = { game, timeLeft: duration };
    if (paused) return;

    const clock = phaseClock.current;
    const startedAt = performance.now();
    const timer = setTimeout(() => {
      if (phase === 'result' && game.winners.length < game.goal) {
        const missesLeft = game.ticket.hit ? Math.floor(Math.random() * 4) : game.missesLeft - 1;
        const ticket = drawTicket(roster, game.remaining, missesLeft, game.serialStart + game.attempt + 1);
        setGame({ ...game, missesLeft, ticket, attempt: game.attempt + 1, phase: 'tear' });
      } else {
        if (phase === 'result') {
          setExcluded(current => [...new Set([...current, ...game.winners])]);
        }
        setGame({ ...game, phase: nextPhase[phase] });
      }
    }, clock.timeLeft);

    return () => {
      clearTimeout(timer);
      clock.timeLeft = Math.max(0, clock.timeLeft - (performance.now() - startedAt));
    };
  }, [game, paused, phase, roster]);

  const eligible = roster.filter(name => !excluded.includes(name));
  const friendIndex = game ? (game.firstFriend + game.attempt) % friends.length : 0;
  const friend = friends[friendIndex];
  const round = game ? Math.floor(game.attempt / game.cardsPerRound) + 1 : 0;
  const cardInRound = game ? game.attempt % game.cardsPerRound + 1 : 0;
  const atTable = phase === 'tear' || phase === 'place' || phase === 'scratch';
  const serial = game ? String((game.serialStart + game.attempt) % 100000).padStart(5, '0') : '';
  const audiovisual = (
    <>
      {canFullscreen && (
        <button className="btn btn--secondary" type="button" onClick={toggleFullscreen}>
          {fullscreen ? 'Thu nhỏ' : 'Toàn màn hình'}
        </button>
      )}
      <button className="btn btn--secondary" type="button" onClick={sound.toggle} aria-pressed={sound.enabled}>
        {sound.enabled ? 'Tắt âm' : 'Bật âm'}
      </button>
    </>
  );

  function editList() {
    returning.current = true;
    setGame(null);
    setPaused(false);
  }

  function openManager() {
    setGame(null);
    setPaused(false);
    setManaging(true);
  }

  function closeManager() {
    returning.current = true;
    setManaging(false);
  }

  function toggleWinner(name) {
    setExcluded(current => current.includes(name) ? current.filter(player => player !== name) : [...current, name]);
  }

  return (
    <main ref={stage} className={`layout hero ${game || managing ? 'game-layout' : 'setup-layout'}${playing ? ' film-layout' : ''}`} data-enter data-phase={phase || (managing ? 'manager' : 'setup')} data-paused={paused}>
      <a className="skip" href="#panel-title">Đến phần chơi</a>
      <div className="scene-art" data-visual aria-hidden="true" />
      <div className="table-art" aria-hidden="true" />
      {!game && !managing && <Welcome />}

      {!game && !managing && (
        <section className="panel" aria-labelledby="panel-title">
          <div className="panel-heading">
            <h2 id="panel-title" tabIndex={-1}>Thiết lập ván chơi</h2>
            <div className="actions">{audiovisual}</div>
          </div>
          <form onSubmit={startGame}>
            <QuantityFields cards={cards} setCards={setCards} />
            <label htmlFor="names">Danh sách người chơi</label>
            <p className="hint" id="names-hint">Nhập họ tên, mỗi người một dòng.</p>
            <textarea id="names" ref={setupInput} value={names} rows={5} placeholder={'Nguyễn Minh Anh\nTrần Gia Huy\nLê Bảo Ngọc'} aria-describedby="names-hint" required onChange={event => {
              event.target.setCustomValidity('');
              event.target.form.elements.namedItem('target').setCustomValidity('');
              setNames(event.target.value);
            }} />
            <button className="btn btn--primary" type="submit">Bắt đầu</button>
          </form>
          <button className="btn btn--secondary edit-list" type="button" onClick={openManager}>Quản lý ván</button>
        </section>
      )}

      {managing && <SessionManager onClose={closeManager} onPlay={list => {
        setNames(list);
        closeManager();
      }} />}

      {playing && (
        <section className="film" aria-labelledby="panel-title">
          <div className="film-bar">
            <div className="film-meta">
              <h2 id="panel-title" ref={heading} tabIndex={-1}>Lượt {round} · Vé {cardInRound}/{game.cardsPerRound}</h2>
              <p>Đã chọn {game.winners.length}/{game.goal} tên</p>
            </div>
            <div className="actions">
              {audiovisual}
              <button className="btn btn--secondary" type="button" onClick={() => setPaused(value => !value)}>{paused ? 'Tiếp tục' : 'Tạm dừng'}</button>
              <button className="btn btn--secondary" type="button" onClick={openManager}>Thoát</button>
            </div>
          </div>
          <div className="film-stage">
            {(phase === 'tear' || phase === 'place') && <TearScene key={game.attempt} />}
            {phase === 'scratch' && <ScratchTicket name={game.ticket.name} serial={serial} style={game.ticket.style} paused={paused} onFinish={finishScratch} onStroke={sound.scratch} />}
            {phase === 'result' && game.ticket.hit && (
              <div className="result-confetti" aria-hidden="true">
                {Array.from({ length: 14 }, (_, index) => (
                  <i key={index} style={{ '--start': `${4 + index * 7}%`, '--delay': `${index % 4 * 85}ms` }} />
                ))}
              </div>
            )}
            {phase === 'result' && (
              <article className="result-panel" data-result={game.ticket.hit ? 'hit' : 'miss'}>
                <p className="result-caption">{game.ticket.hit ? 'Trúng thưởng!' : 'Trượt rồi'}</p>
                <p className="result-name">{game.ticket.name}</p>
                {!game.ticket.hit && <p className="hint">Chúc bạn may mắn lần sau.</p>}
                {game.winners.length === game.goal && <p className="hint">Đã chọn đủ số tên.</p>}
              </article>
            )}
          </div>
          <p className="scene-line" role="status">
            {phase !== 'intro' && <span className="friend-portrait" data-friend={friendIndex} aria-hidden="true" />}
            {phase === 'intro' ? phaseText.intro
              : atTable ? `${friend} ${phaseText[phase]}`
              : `${friend} cào được ${game.ticket.name}. ${game.ticket.hit ? 'Trúng tên.' : 'Tên ngoài danh sách.'}`}
          </p>
        </section>
      )}

      {phase === 'scoreboard' && (
        <section className="panel scoreboard" aria-labelledby="panel-title">
          <div className="panel-heading">
            <h2 id="panel-title" ref={heading} tabIndex={-1}>Bảng xếp hạng</h2>
            <div className="actions">{audiovisual}</div>
          </div>
          <p className="hint">Theo thứ tự cào trúng. Còn {eligible.length}/{roster.length} người trong danh sách cào tiếp.</p>
          <ol className="ranking">
            {game.winners.map(name => {
              const removed = excluded.includes(name);
              return (
                <li key={name}>
                  <div className="rank-row">
                    <span>{name}{removed && <small>Đã loại</small>}</span>
                    <button className="btn btn--secondary" type="button" aria-label={`${removed ? 'Khôi phục' : 'Loại'} ${name}`} onClick={() => toggleWinner(name)}>
                      {removed ? 'Khôi phục' : 'Loại'}
                    </button>
                  </div>
                </li>
              );
            })}
          </ol>
          {game.winners.some(name => !excluded.includes(name)) && (
            <button className="btn btn--secondary" type="button" onClick={() => setExcluded(current => [...new Set([...current, ...game.winners])])}>Loại tất cả người vừa trúng</button>
          )}
          {eligible.length > 0 ? (
            <form key={eligible.length} className="replay" onSubmit={event => {
              event.preventDefault();
              const quantities = readQuantities(event.currentTarget, eligible.length);
              if (quantities) startBatch(quantities, roster, eligible);
            }}>
              <QuantityFields suffix="-replay" goal={Math.min(game.goal, eligible.length)} cards={cards} setCards={setCards} max={eligible.length} />
              <button className="btn btn--primary" type="submit">Cào tiếp</button>
            </form>
          ) : <p className="hint no-players">Đã loại hết người chơi. Khôi phục hoặc sửa danh sách để cào tiếp.</p>}
          <div className="actions edit-list">
            <button className="btn btn--secondary" type="button" onClick={editList}>Sửa danh sách</button>
            <button className="btn btn--secondary" type="button" onClick={openManager}>Quản lý ván</button>
          </div>
        </section>
      )}
    </main>
  );
}
