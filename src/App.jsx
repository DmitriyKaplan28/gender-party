import { useState, useEffect } from 'react';
import { supabase } from './config/supabase';
import confetti from 'canvas-confetti';
import { motion, AnimatePresence } from 'framer-motion';
import './App.css';
//test commit

function App() {
  const [mode, setMode] = useState('parent'); // 'parent' or 'keeper'
  const [gender, setGender] = useState(null);
  const [loading, setLoading] = useState(true);
  const [revealed, setRevealed] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [isAdminAuth, setIsAdminAuth] = useState(false);
  const [tempGender, setTempGender] = useState(null);
  const [selectedRole, setSelectedRole] = useState(null); // 'parent', 'aunt', 'grandma'

  // Загрузка текущего пола при старте
  useEffect(() => {
    loadGender();
    
    // Подписка на реальные обновления
    const subscription = supabase
      .channel('gender_changes')
      .on('postgres_changes', 
        { event: 'UPDATE', schema: 'public', table: 'secrets' },
        (payload) => {
          setGender(payload.new.gender);
        }
      )
      .subscribe();
      
    return () => subscription.unsubscribe();
  }, []);

  const loadGender = async () => {
    const { data } = await supabase
      .from('secrets')
      .select('gender')
      .eq('id', 1)
      .single();
    
    if (data) setGender(data.gender);
    setLoading(false);
  };

  const updateGender = async (newGender) => {
    await supabase
      .from('secrets')
      .update({ gender: newGender, updated_at: new Date() })
      .eq('id', 1);
    
    setGender(newGender);
  };

  const handleReveal = (role) => {
    if (!gender) return;
    
    // Запуск конфетти (розовое, потому что девочка)
    confetti({
      particleCount: 250,
      spread: 120,
      origin: { y: 0.6 },
      colors: ['#EC4899', '#F43F5E', '#FBCFE8', '#F472B6']
    });
    
    setSelectedRole(role);
    setRevealed(true);
  };

  const getMessageByRole = () => {
    switch(selectedRole) {
      case 'parent':
        return 'У вас будет ВНУЧКА!';
      case 'aunt':
        return 'У вас будет ПЛЕМЯННИЦА!';
      case 'grandma':
        return 'У тебя будет ПРАВНУЧКА!';
      default:
        return 'Это ДЕВОЧКА!';
    }
  };

  const handleAdminLogin = () => {
    if (pinInput === '1234') {
      setIsAdminAuth(true);
      setTempGender(gender);
      setPinInput('');
    } else {
      alert('Неверный PIN-код');
    }
  };

  const handleSaveGender = async () => {
    if (tempGender) {
      await updateGender(tempGender);
      setIsAdminAuth(false);
      setMode('parent');
      setRevealed(false);
      setSelectedRole(null);
    }
  };

  const resetGame = () => {
    setRevealed(false);
    setSelectedRole(null);
  };

  if (loading) {
    return <div className="loading">Загрузка магии...</div>;
  }

  // Режим Хранителя (админка)
  if (mode === 'keeper' && isAdminAuth) {
    return (
      <div className="admin-panel">
        <h2>🔮 Выбери пол ребенка</h2>
        <div className="gender-select">
          <button 
            className={`gender-btn ${tempGender === 'boy' ? 'selected-boy' : ''}`}
            onClick={() => setTempGender('boy')}
          >
            👦 Мальчик
          </button>
          <button 
            className={`gender-btn ${tempGender === 'girl' ? 'selected-girl' : ''}`}
            onClick={() => setTempGender('girl')}
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
  if (mode === 'keeper') {
    return (
      <div className="login-panel">
        <h2>🔐 Вход для Хранителя секрета</h2>
        <input
          type="password"
          placeholder="Введите PIN-код"
          value={pinInput}
          onChange={(e) => setPinInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleAdminLogin()}
        />
        <button onClick={handleAdminLogin}>Войти</button>
        <button onClick={() => setMode('parent')} className="back-btn">
          ← Назад к гостям
        </button>
      </div>
    );
  }

  // Режим выбора роли (новый экран)
  if (!revealed) {
    return (
      <div className="app">
        <div className="content">
          <motion.div
            key="role-selector"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="role-container"
          >
             <h1>Выберите, кто вы</h1>
{/*             
            {!gender ? (
              <p className="waiting-text">
                Хранитель ещё не ввёл пол ребенка<br/>
                Попросите его зайти в админ-панель (⚡ в углу)
              </p>
            ) : gender === 'boy' ? (
              <p className="waiting-text boy-warning">
                ⚠️ Хранитель установил пол: МАЛЬЧИК<br/>
                Но приложение настроено только для ДЕВОЧКИ<br/>
                Пожалуйста, обнови настройки в админ-панели
              </p>
            ) : ( */}
              <>
                <button 
                  className="role-btn parent-btn"
                  onClick={() => handleReveal('parent')}
                >
                  <span className="role-label">Я мама / папа  </span>
                  <span className="role-sub">(Люба / Серёжа)</span>
                </button>
                
                <button 
                  className="role-btn aunt-btn"
                  onClick={() => handleReveal('aunt')}
                >
                  <span className="role-label">Я Даша / Денис</span>
                  <span className="role-sub">(Если кто-то скинул Денису ссылку)</span>
                </button>
                
                <button 
                  className="role-btn grandma-btn"
                  onClick={() => handleReveal('grandma')}
                >
                  <span className="role-label">Я бабушка Аля </span>
                  <span className="role-sub">(Если не сможете ей переслать, то вы уж если что доедьте до неё пусть на вашем телефоне нажмёт)</span>
                </button>
              </>
           {/* )} */}
          </motion.div>

          {/* Скрытый вход в админку */}
          {/* <div 
            className="admin-trigger"
            onContextMenu={(e) => {
              e.preventDefault();
              setMode('keeper');
            }}
          >
            ⚡
          </div> */}
        </div>
      </div>
    );
  }

  // Режим результата (анимация + поздравление)
  return (
    <div className="app">
      <div className="content">
        <AnimatePresence mode="wait">
          <motion.div
            key="result"
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0, rotate: 180 }}
            transition={{ type: 'spring', damping: 12 }}
            className="result-container girl-bg"
          >
            <div className="result-content">
              <div className="icon">
                👧🎀
              </div>
              <h1>{getMessageByRole()}</h1>
              <button onClick={resetGame} className="again-btn">
                🎊 Сыграть ещё раз 🎊
              </button>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Скрытый вход в админку */}
        <div 
          className="admin-trigger"
          onContextMenu={(e) => {
            e.preventDefault();
            setMode('keeper');
          }}
        >
          ⚡
        </div>
      </div>
    </div>
  );
}

export default App;
