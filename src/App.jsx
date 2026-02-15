import { useEffect, useMemo, useRef, useState } from "react";

const STORAGE_KEY = "flashdeck-study.v1";

function nowId() {
  return `${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function loadDeck() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || !Array.isArray(parsed.cards)) return null;
    return parsed;
  } catch {
    return null;
  }
}

function saveDeck(deck) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(deck));
}

function defaultDeck() {
  return {
    name: "My Deck",
    cards: [
      {
        id: nowId(),
        front: "What is a higher order function?",
        back: "A function that takes a function as an argument, returns a function, or both.",
        known: false,
        createdAt: Date.now(),
      },
      {
        id: nowId(),
        front: "React hook used for state?",
        back: "useState",
        known: false,
        createdAt: Date.now(),
      },
      {
        id: nowId(),
        front: "How do you persist data in the browser?",
        back: "Use localStorage to store JSON data and reload it on startup.",
        known: false,
        createdAt: Date.now(),
      },
    ],
  };
}

function validateCard({ front, back }) {
  const errors = {};
  if (!front || front.trim().length < 2) errors.front = "Front must be at least 2 characters.";
  if (!back || back.trim().length < 2) errors.back = "Back must be at least 2 characters.";
  if (front && front.length > 500) errors.front = "Front is too long (max 500).";
  if (back && back.length > 1500) errors.back = "Back is too long (max 1500).";
  return errors;
}

function shuffleArray(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function App() {
  const [deckName, setDeckName] = useState("My Deck");
  const [cards, setCards] = useState([]);
  const [filter, setFilter] = useState("all"); // all | known | unknown
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("newest"); // newest | oldest | alpha
  const [studyIndex, setStudyIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [front, setFront] = useState("");
  const [back, setBack] = useState("");
  const [known, setKnown] = useState(false);
  const [errors, setErrors] = useState({});

  const loadedOnce = useRef(false);

  useEffect(() => {
    if (loadedOnce.current) return;
    loadedOnce.current = true;

    const loaded = loadDeck();
    if (loaded) {
      setDeckName(loaded.name || "My Deck");
      setCards(loaded.cards);
      return;
    }

    const d = defaultDeck();
    setDeckName(d.name);
    setCards(d.cards);
  }, []);

  useEffect(() => {
    if (!loadedOnce.current) return;
    saveDeck({ name: deckName, cards });
  }, [deckName, cards]);

  const visibleCards = useMemo(() => {
    const q = query.trim().toLowerCase();

    const filtered = cards
      .filter((c) => {
        if (filter === "known") return c.known;
        if (filter === "unknown") return !c.known;
        return true;
      })
      .filter((c) => {
        if (!q) return true;
        return (c.front || "").toLowerCase().includes(q) || (c.back || "").toLowerCase().includes(q);
      });

    if (sort === "newest") return [...filtered].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    if (sort === "oldest") return [...filtered].sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
    return [...filtered].sort((a, b) => (a.front || "").localeCompare(b.front || ""));
  }, [cards, filter, query, sort]);

  const stats = useMemo(() => {
    const total = cards.length;
    const knownCount = cards.filter((c) => c.known).length;
    return { total, known: knownCount, unknown: total - knownCount };
  }, [cards]);

  useEffect(() => {
    setStudyIndex(0);
    setIsFlipped(false);
  }, [filter, query, sort]);

  useEffect(() => {
    if (visibleCards.length === 0) {
      setStudyIndex(0);
      setIsFlipped(false);
      return;
    }
    if (studyIndex >= visibleCards.length) {
      setStudyIndex(0);
      setIsFlipped(false);
    }
  }, [visibleCards.length, studyIndex]);

  function resetForm() {
    setFront("");
    setBack("");
    setKnown(false);
    setErrors({});
    setEditingId(null);
  }

  function startEdit(card) {
    setEditingId(card.id);
    setFront(card.front || "");
    setBack(card.back || "");
    setKnown(Boolean(card.known));
    setErrors({});
  }

  function upsertCard(e) {
    e.preventDefault();
    const nextErrors = validateCard({ front, back });
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    if (editingId) {
      setCards((prev) =>
        prev.map((c) =>
          c.id === editingId
            ? { ...c, front: front.trim(), back: back.trim(), known: Boolean(known) }
            : c
        )
      );
      resetForm();
      return;
    }

    const newCard = {
      id: nowId(),
      front: front.trim(),
      back: back.trim(),
      known: Boolean(known),
      createdAt: Date.now(),
    };

    setCards((prev) => [newCard, ...prev]);
    resetForm();
  }

  function deleteCard(id) {
    setCards((prev) => prev.filter((c) => c.id !== id));
    setIsFlipped(false);
    setStudyIndex(0);
  }

  function toggleKnown(id) {
    setCards((prev) => prev.map((c) => (c.id === id ? { ...c, known: !c.known } : c)));
  }

  function toggleKnownForCurrent() {
    const current = visibleCards[studyIndex];
    if (!current) return;
    toggleKnown(current.id);
  }

  function nextCard() {
    if (visibleCards.length === 0) return;
    setStudyIndex((i) => (i + 1 >= visibleCards.length ? 0 : i + 1));
    setIsFlipped(false);
  }

  function prevCard() {
    if (visibleCards.length === 0) return;
    setStudyIndex((i) => (i - 1 < 0 ? visibleCards.length - 1 : i - 1));
    setIsFlipped(false);
  }

  function shuffleVisible() {
    if (visibleCards.length < 2) return;

    const visibleIds = new Set(visibleCards.map((c) => c.id));
    const shuffledVisible = shuffleArray(visibleCards);

    setCards((prev) => {
      let k = 0;
      return prev.map((c) => {
        if (!visibleIds.has(c.id)) return c;
        const next = shuffledVisible[k];
        k += 1;
        return next;
      });
    });

    setStudyIndex(0);
    setIsFlipped(false);
  }

  function clearAll() {
    setCards([]);
    resetForm();
    setStudyIndex(0);
    setIsFlipped(false);
  }

  const current = visibleCards[studyIndex] || null;
  const studyText = current ? (isFlipped ? current.back : current.front) : "";
  const studySide = current ? (isFlipped ? "Back" : "Front") : "";

  useEffect(() => {
    const onKeyDown = (e) => {
      if (
        e.target &&
        (e.target.tagName === "INPUT" ||
          e.target.tagName === "TEXTAREA" ||
          e.target.isContentEditable)
      ) {
        return;
      }

      if (e.key === " ") {
        e.preventDefault();
        setIsFlipped((v) => !v);
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        nextCard();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        prevCard();
      } else if (e.key.toLowerCase() === "k") {
        e.preventDefault();
        toggleKnownForCurrent();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [visibleCards, studyIndex]);

  return (
    <div className="container">
      <div className="header">
        <div>
          <h1 className="h1">FlashDeck Study</h1>
          <div className="muted">
            Shortcuts: <span className="kbd">Space</span> flip,{" "}
            <span className="kbd">←</span>/<span className="kbd">→</span>{" "}
            prev/next, <span className="kbd">K</span> known
          </div>
        </div>
        <div style={{ minWidth: 240 }}>
          <div className="label">Deck name</div>
          <input
            type="text"
            value={deckName}
            onChange={(e) => setDeckName(e.target.value)}
            placeholder="My Deck"
          />
        </div>
      </div>

      <div className="grid">
        <div className="card">
          <div className="row">
            <div>
              <div className="label">Search</div>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search front or back..."
              />
            </div>
            <div>
              <div className="label">Filter</div>
              <select value={filter} onChange={(e) => setFilter(e.target.value)}>
                <option value="all">All</option>
                <option value="unknown">Unknown</option>
                <option value="known">Known</option>
              </select>
            </div>
            <div>
              <div className="label">Sort</div>
              <select value={sort} onChange={(e) => setSort(e.target.value)}>
                <option value="newest">Newest</option>
                <option value="oldest">Oldest</option>
                <option value="alpha">A to Z (front)</option>
              </select>
            </div>
          </div>

          <div className="pillRow">
            <div className="pill">
              Total: <b>{stats.total}</b>
            </div>
            <div className="pill">
              Known: <b>{stats.known}</b>
            </div>
            <div className="pill">
              Unknown: <b>{stats.unknown}</b>
            </div>
            <div className="pill small">Saved automatically (localStorage)</div>
          </div>

          <div className="hr" />

          <div className="label">Study</div>
          <div
            className="studyCard"
            role="button"
            tabIndex={0}
            onClick={() => setIsFlipped((v) => !v)}
            onKeyDown={(e) => {
              if (e.key === "Enter") setIsFlipped((v) => !v);
            }}
            title="Click to flip"
          >
            {current ? (
              <>
                <div className="studySide">
                  {studySide} {"•"} {studyIndex + 1} / {visibleCards.length} {"•"}{" "}
                  {current.known ? "Known" : "Unknown"}
                </div>
                <p className="studyText">{studyText}</p>
                <div className="footerNote">Click to flip</div>
              </>
            ) : (
              <>
                <div className="studySide">No cards match your filters</div>
                <p className="studyText">Add a card or change search or filter.</p>
              </>
            )}
          </div>

          <div className="btnRow" style={{ marginTop: 12 }}>
            <button onClick={prevCard} disabled={visibleCards.length === 0}>
              Prev
            </button>
            <button onClick={nextCard} disabled={visibleCards.length === 0}>
              Next
            </button>
            <button
              onClick={() => setIsFlipped((v) => !v)}
              disabled={visibleCards.length === 0}
            >
              Flip
            </button>
            <button onClick={toggleKnownForCurrent} disabled={visibleCards.length === 0}>
              Toggle Known
            </button>
            <button onClick={shuffleVisible} disabled={visibleCards.length < 2}>
              Shuffle
            </button>
          </div>
        </div>

        <div className="card">
          <div className="label">{editingId ? "Edit card" : "Add card"}</div>
          <form onSubmit={upsertCard}>
            <div style={{ marginBottom: 10 }}>
              <div className="label">Front</div>
              <input type="text" value={front} onChange={(e) => setFront(e.target.value)} />
              {errors.front ? <div className="error">{errors.front}</div> : null}
            </div>

            <div style={{ marginBottom: 10 }}>
              <div className="label">Back</div>
              <textarea value={back} onChange={(e) => setBack(e.target.value)} />
              {errors.back ? <div className="error">{errors.back}</div> : null}
            </div>

            <div className="pillRow" style={{ marginBottom: 12 }}>
              <label className="pill" style={{ cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={known}
                  onChange={(e) => setKnown(e.target.checked)}
                  style={{ flex: "0 0 auto" }}
                />
                Mark as known
              </label>
            </div>

            <div className="btnRow">
              <button className="primary" type="submit">
                {editingId ? "Save changes" : "Add card"}
              </button>
              <button
                type="button"
                onClick={resetForm}
                disabled={!editingId && !front && !back && !known}
              >
                Reset
              </button>
              <button className="danger" type="button" onClick={clearAll} disabled={cards.length === 0}>
                Clear deck
              </button>
            </div>
          </form>

          <div className="hr" />

          <div className="label">Cards ({visibleCards.length} shown)</div>
          <div className="list">
            {visibleCards.length === 0 ? (
              <div className="muted">No cards to show.</div>
            ) : (
              visibleCards.map((c) => (
                <div className="item" key={c.id}>
                  <div>
                    <p className="itemTitle">{c.front}</p>
                    <p className="itemMeta">
                      {c.known ? "Known" : "Unknown"} {"•"}{" "}
                      {new Date(c.createdAt || Date.now()).toLocaleString()}
                    </p>
                  </div>
                  <div className="btnRow" style={{ justifyContent: "flex-end" }}>
                    <button onClick={() => toggleKnown(c.id)}>
                      {c.known ? "Mark Unknown" : "Mark Known"}
                    </button>
                    <button onClick={() => startEdit(c)}>Edit</button>
                    <button className="danger" onClick={() => deleteCard(c.id)}>
                      Delete
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="footerNote">Study uses your current search, filter, and sort.</div>
        </div>
      </div>
    </div>
  );
}