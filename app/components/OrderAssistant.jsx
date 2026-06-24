"use client";
import { useState, useRef, useEffect } from "react";
import { MENU_GROUPS, SITE, IMAGES } from "../site.config";

/* ---------- helpers (all logic runs in the browser, no AI service needed) ---------- */
const priceNum = (p) => {
  const m = String(p).match(/\d+/);
  return m ? parseInt(m[0], 10) : 0;
};
const groupItems = (needles) =>
  MENU_GROUPS.filter((g) => needles.some((n) => g.group.includes(n))).flatMap((g) => g.items);

// Decide the next question from what we already know. Returns null when ready to recommend.
function getQuestion(a) {
  if (!a.category)
    return {
      key: "category",
      text: "¡Hola! Soy el asistente del Perri 🌭 Te ayudo a decidir qué pedir. ¿Qué se te antoja?",
      options: [
        { label: "🍔 Algo de comer", value: "comer" },
        { label: "🍦 Algo dulce", value: "dulce" },
        { label: "🥤 Algo de tomar", value: "tomar" },
        { label: "🎲 Sorpréndeme", value: "sorpresa" },
      ],
    };

  if (a.category === "comer") {
    if (!a.sub)
      return {
        key: "sub",
        text: "Perfecto, a comer se dijo 😋 ¿Qué se te antoja más?",
        options: [
          { label: "Arepas / Patacones", value: "arepas" },
          { label: "Hamburguesa", value: "burger" },
          { label: "Salchipapa", value: "salchi" },
          { label: "Cono cargado", value: "cono" },
          { label: "Para picar", value: "picar" },
          { label: "Lo que sea 🙌", value: "any" },
        ],
      };
    if (a.sub !== "picar" && !a.protein)
      return {
        key: "protein",
        text: "Buena elección 👌 ¿Proteína favorita?",
        options: [
          { label: "Carne 🥩", value: "carne" },
          { label: "Pollo 🍗", value: "pollo" },
          { label: "Cualquiera", value: "any" },
        ],
      };
    if (!a.hunger)
      return {
        key: "hunger",
        text: "Cuéntame, ¿qué tan hambriento estás hoy?",
        options: [
          { label: "Solo un antojito", value: "antojito" },
          { label: "Con hambre", value: "hambre" },
          { label: "Modo bestia 🔥", value: "bestia" },
        ],
      };
    return null;
  }

  if (a.category === "dulce") {
    if (!a.sweetType)
      return {
        key: "sweetType",
        text: "Mmm, dulce... Buena idea 🍬 ¿Qué tipo de dulce te provoca?",
        options: [
          { label: "Helado / Malteada 🍦", value: "helado" },
          { label: "Waffle 🧇", value: "waffle" },
          { label: "Algo con fruta 🍓", value: "fruta" },
          { label: "Sorpréndeme", value: "any" },
        ],
      };
    return null;
  }

  if (a.category === "tomar") {
    if (!a.drinkType)
      return {
        key: "drinkType",
        text: "Perfecto, una buena bebida siempre viene bien 🥤 ¿Qué quieres?",
        options: [
          { label: "Jugo natural 🧃", value: "jugo" },
          { label: "Granizado", value: "granizado" },
          { label: "Gaseosa 🥃", value: "gaseosa" },
          { label: "Cerveza 🍺", value: "cerveza" },
          { label: "Algo caliente ☕", value: "caliente" },
        ],
      };
    return null;
  }

  return null; // sorpresa → recommend immediately
}

function recommend(a) {
  let pool = [];
  if (a.category === "comer") {
    const map = {
      arepas: ["Patacones", "Arepas rellenas"],
      burger: ["Hamburguesas"],
      salchi: ["Salchipapas"],
      cono: ["Conos"],
      picar: ["Entradas"],
      any: ["Entradas", "Arepas rellenas", "Patacones", "Salchipapas", "Hamburguesas", "Conos"],
    };
    pool = groupItems(map[a.sub] || map.any);
    if (a.protein === "carne") {
      const f = pool.filter((i) => /carne|chicharr|chorizo|res/i.test(i.desc));
      if (f.length) pool = f;
    } else if (a.protein === "pollo") {
      const f = pool.filter((i) => /pollo/i.test(i.desc));
      if (f.length) pool = f;
    }
    pool = [...pool].sort((x, y) => priceNum(x.price) - priceNum(y.price));
    if (a.hunger === "antojito") pool = pool.slice(0, 2);
    else if (a.hunger === "bestia") pool = pool.slice(-2).reverse();
    else {
      const mid = Math.floor(pool.length / 2);
      pool = pool.slice(Math.max(0, mid - 1), mid + 1);
    }
  } else if (a.category === "dulce") {
    pool = groupItems(["Heladería"]);
    if (a.sweetType === "helado")
      pool = pool.filter((i) => /helado|malteada|banana/i.test((i.name + i.desc).toLowerCase()));
    else if (a.sweetType === "waffle") pool = pool.filter((i) => /wafle/i.test(i.name.toLowerCase()));
    else if (a.sweetType === "fruta")
      pool = pool.filter((i) => /fruta|fresas/i.test(i.name.toLowerCase()));
    if (!pool.length) pool = groupItems(["Heladería"]);
    pool = pool.slice(0, 2);
  } else if (a.category === "tomar") {
    const map = {
      jugo: ["Jugos naturales"],
      granizado: ["Jugos naturales"],
      gaseosa: ["Gaseosas"],
      cerveza: ["Cervezas"],
      caliente: ["Bebidas calientes"],
    };
    pool = groupItems(map[a.drinkType] || ["Jugos naturales"]);
    if (a.drinkType === "jugo") pool = pool.filter((i) => !/granizado/i.test(i.name));
    else if (a.drinkType === "granizado") pool = pool.filter((i) => /granizado/i.test(i.name));
    pool = pool.slice(0, 2);
  } else {
    // sorpresa: pick a random signature/tagged item
    const tagged = MENU_GROUPS.flatMap((g) => g.items).filter((i) => i.tag);
    const base = tagged.length ? tagged : MENU_GROUPS.flatMap((g) => g.items);
    pool = [base[Math.floor(Math.random() * base.length)]];
  }
  return pool.filter(Boolean).slice(0, 2);
}

function reasonText(a) {
  if (a.category === "sorpresa") return "🎲 La casa recomienda — esto es fire:";
  if (a.category === "dulce") return "Para el diente dulce 🍨, esto te va a encantar:";
  if (a.category === "tomar") return "La pareja perfecta 🎯:";
  if (a.hunger === "bestia") return "Modo bestia activado 🔥 — esto es para quedarse satisfecho:";
  if (a.hunger === "antojito") return "Un antojito perfecto, ni mucho ni poco 😋:";
  return "Con eso en mente, te tengo lo ideal:";
}

export function OrderAssistant() {
  const [open, setOpen] = useState(false);
  const [answers, setAnswers] = useState({});
  const [messages, setMessages] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [showFavorites, setShowFavorites] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const endRef = useRef(null);

  const start = () => {
    const q = getQuestion({});
    setAnswers({});
    setShowFavorites(false);
    setMessages([{ from: "bot", text: q.text, options: q.options, key: q.key }]);
  };

  useEffect(() => {
    if (open && messages.length === 0) start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages]);

  const pick = (key, option) => {
    const na = { ...answers, [key]: option.value };
    setAnswers(na);
    setIsTyping(true);
    setTimeout(() => {
      setMessages((prev) => {
        const next = prev.map((m, i) => (i === prev.length - 1 ? { ...m, options: null } : m));
        next.push({ from: "user", text: option.label });
        const q = getQuestion(na);
        if (q) next.push({ from: "bot", text: q.text, options: q.options, key: q.key });
        else next.push({ from: "bot", text: reasonText(na), recs: recommend(na) });
        return next;
      });
      setIsTyping(false);
    }, 600);
  };

  const toggleFavorite = (item) => {
    setFavorites((prev) => {
      const isFav = prev.find((f) => f.id === item.id);
      return isFav ? prev.filter((f) => f.id !== item.id) : [...prev, item];
    });
  };

  const isFavorited = (itemId) => favorites.some((f) => f.id === itemId);

  if (!open) {
    return (
      <button className="assistant-fab" onClick={() => setOpen(true)} aria-label="Abrir asistente: ¿qué pido?">
        <span className="dot" aria-hidden="true" />
        ¿Qué pido?
      </button>
    );
  }

  if (showFavorites && favorites.length > 0) {
    return (
      <div className="assistant-panel" role="dialog" aria-label="Favoritos - Asistente El Perri">
        <div className="assistant-head">
          {SITE.logo && <img src={SITE.logo} alt="" aria-hidden="true" />}
          <div>
            <div className="at">Mis Favoritos ❤️</div>
            <div className="as">{favorites.length} guardados</div>
          </div>
          <button className="ax" onClick={() => setOpen(false)} aria-label="Cerrar asistente">
            ×
          </button>
        </div>

        <div className="assistant-body">
          <div className="assistant-recs">
            {favorites.map((r) => (
              <div className="assistant-rec assistant-rec-fav" key={r.id}>
                <div className="assistant-rec-head">
                  <strong>{r.name}</strong>
                  <span className="assistant-rec-price">{r.price}</span>
                </div>
                {r.desc && <p>{r.desc}</p>}
                <div className="assistant-actions" style={{ marginTop: "8px" }}>
                  <button
                    className="assistant-opt assistant-heart"
                    onClick={() => toggleFavorite(r)}
                    aria-label="Remover de favoritos"
                  >
                    ❤️ Guardado
                  </button>
                  <a href="/menu" className="assistant-opt">
                    Ver menú
                  </a>
                </div>
              </div>
            ))}
          </div>
          <div className="assistant-actions">
            <button className="assistant-opt" onClick={() => setShowFavorites(false)}>
              ← Volver
            </button>
          </div>
          <div ref={endRef} />
        </div>
      </div>
    );
  }

  return (
    <div className="assistant-panel" role="dialog" aria-label="Asistente El Perri">
      <div className="assistant-head">
        {SITE.logo && <img src={SITE.logo} alt="" aria-hidden="true" />}
        <div>
          <div className="at">Asistente El Perri</div>
          <div className="as">Te ayudo a decidir qué pedir</div>
        </div>
        <div className="assistant-head-buttons">
          {favorites.length > 0 && (
            <button
              className="ax-icon"
              onClick={() => setShowFavorites(true)}
              aria-label="Ver favoritos"
              title="Mis favoritos"
            >
              ❤️ {favorites.length}
            </button>
          )}
          <button className="ax" onClick={() => setOpen(false)} aria-label="Cerrar asistente">
            ×
          </button>
        </div>
      </div>

      <div className="assistant-body">
        {messages.map((m, i) => (
          <div key={i} style={{ display: "contents" }}>
            <div className={`assistant-msg ${m.from} fade-in`}>{m.text}</div>

            {m.options && (
              <div className="assistant-options fade-in">
                {m.options.map((opt) => (
                  <button key={opt.value} className="assistant-opt" onClick={() => pick(m.key, opt)}>
                    {opt.label}
                  </button>
                ))}
              </div>
            )}

            {m.recs && (
              <div className="assistant-recs fade-in">
                {m.recs.map((r) => (
                  <div className="assistant-rec" key={r.id}>
                    <div className="assistant-rec-head">
                      <div>
                        <strong>{r.name}</strong>
                        <span className="assistant-rec-price">{r.price}</span>
                      </div>
                      <button
                        className="assistant-heart-btn"
                        onClick={() => toggleFavorite(r)}
                        aria-label={isFavorited(r.id) ? "Remover de favoritos" : "Agregar a favoritos"}
                        title={isFavorited(r.id) ? "Remover de favoritos" : "Agregar a favoritos"}
                      >
                        {isFavorited(r.id) ? "❤️" : "🤍"}
                      </button>
                    </div>
                    {r.desc && <p>{r.desc}</p>}
                  </div>
                ))}
                <div className="assistant-actions">
                  <button className="assistant-opt" onClick={start}>
                    ↺ Empezar de nuevo
                  </button>
                  <a href="/menu" className="assistant-opt">
                    Ver el menú
                  </a>
                </div>
              </div>
            )}
          </div>
        ))}

        {isTyping && (
          <div className="assistant-typing fade-in">
            <span></span>
            <span></span>
            <span></span>
          </div>
        )}

        <div ref={endRef} />
      </div>
    </div>
  );
}
