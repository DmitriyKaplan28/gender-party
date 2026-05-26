import { useState, useEffect } from "react";
import { supabase } from "./config/supabase";
import confetti from "canvas-confetti";
import { motion, AnimatePresence } from "framer-motion";
import "./App.css";

function App() {
  const [mode, setMode] = useState("parent"); // 'parent' or 'keeper'
  const [gender, setGender] = useState(null);
  const [loading, setLoading] = useState(true);
  const [revealed, setRevealed] = useState(false);
  const [pinInput, setPinInput] = useState("");
  const [isAdminAuth, setIsAdminAuth] = useState(false);
  const [tempGender, setTempGender] = useState(null);

  // Загрузка текущего пола при старте
  useEffect(() => {
    loadGender();

    // Подписка на реальные обновления
    const subscription = supabase
      .channel("gender_changes")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "secrets" },
        (payload) => {
          if (mode === "parent" && !revealed) {
            // Не показываем автоматически, только при нажатии кнопки
            setGender(payload.new.gender);
          }
        },
      )
      .subscribe();

    return () => subscription.unsubscribe();
  }, [mode, revealed]);

  const loadGender = async () => {
    const { data } = await supabase
      .from("secrets")
      .select("gender")
      .eq("id", 1)
      .single();

    if (data) setGender(data.gender);
    setLoading(false);
  };

  const updateGender = async (newGender) => {
    await supabase
      .from("secrets")
      .update({ gender: newGender })
      .eq("id", 1);
  };

  const handleReveal = () => {
    if (!gender) return;

    // Запуск конфетти
    confetti({
      particleCount: 200,
      spread: 100,
      origin: { y: 0.6 },
      colors:
        gender === "boy" ? ["#1E3A8A", "#3B82F6"] : ["#EC4899", "#F43F5E"],
    });

    setRevealed(true);
  };

  const handleAdminLogin = () => {
    // Простой PIN: 1234 (можно сменить)
    if (pinInput === "1234") {
      setIsAdminAuth(true);
      setTempGender(gender);
      setPinInput("");
    } else {
      alert("Неверный PIN-код");
    }
  };

  const handleSaveGender = async () => {
    if (tempGender) {
      await updateGender(tempGender);
      setIsAdminAuth(false);
      setMode("parent");
      setRevealed(false);
    }
  };

  if (loading) {
    return <div className="loading">Загрузка магии...</div>;
  }

  // Режим Хранителя (админка)
  if (mode === "keeper" && isAdminAuth) {
    return (
      <div className="admin-panel">
        <h2>🔮 Выбери пол ребенка</h2>
        <div className="gender-select">
          <button
            className={`gender-btn ${tempGender === "boy" ? "selected-boy" : ""}`}
            onClick={() => setTempGender("boy")}
          >
            👦 Мальчик
          </button>
          <button
            className={`gender-btn ${tempGender === "girl" ? "selected-girl" : ""}`}
            onClick={() => setTempGender("girl")}
          >
            👧 Девочка
          </button>
        </div>
        <button onClick={handleSaveGender} className="save-btn">
          Сохранить и завершить
        </button>
      </div>
    );
  }

  // Режим входа Хранителя
  if (mode === "keeper") {
    return (
      <div className="login-panel">
        <h2>🔐 Вход для Хранителя секрета</h2>
        <input
          type="password"
          placeholder="Введите PIN-код"
          value={pinInput}
          onChange={(e) => setPinInput(e.target.value)}
          onKeyPress={(e) => e.key === "Enter" && handleAdminLogin()}
        />
        <button onClick={handleAdminLogin}>Войти</button>
        <button onClick={() => setMode("parent")} className="back-btn">
          ← Назад к гостям
        </button>
      </div>
    );
  }

  // Режим Родителей (гостевой)
  return (
    <div className="app">
      <div className="content">
        <AnimatePresence mode="wait">
          {!revealed ? (
            <motion.div
              key="button"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.5 }}
              className="button-container"
            >
              <h1>🎉 Кто у нас родится? 🎉</h1>
              <button
                className="reveal-btn"
                onClick={handleReveal}
                disabled={!gender}
              >
                {gender ? "УЗНАТЬ ПОЛ" : "Ожидание секрета..."}
              </button>
              {!gender && (
                <p className="waiting-text">
                  Хранитель ещё не ввёл пол ребенка
                  <br />
                  Попросите его зайти в админ-панель
                </p>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="result"
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0, rotate: 180 }}
              transition={{ type: "spring", damping: 12 }}
              className={`result-container ${gender === "boy" ? "boy-bg" : "girl-bg"}`}
            >
              <div className="result-content">
                <div className="icon">{gender === "boy" ? "👶💙" : "👧🎀"}</div>
                <h1>{gender === "boy" ? "Это МАЛЬЧИК!" : "Это ДЕВОЧКА!"}</h1>
                <button
                  onClick={() => setRevealed(false)}
                  className="again-btn"
                >
                  🎊 Сыграть ещё раз 🎊
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Скрытый вход в админку (долгое нажатие на логотип) */}
        <div
          className="admin-trigger"
          onContextMenu={(e) => {
            e.preventDefault();
            setMode("keeper");
          }}
        >
          ⚡
        </div>
      </div>
    </div>
  );
}

export default App;
