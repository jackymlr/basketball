import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AppProvider } from './contexts/AppContext';
import { Layout } from './components/Layout';
import { Home } from './pages/Home';
import { Teams } from './pages/Teams';
import { Players } from './pages/Players';
import { Games } from './pages/Games';
import { GameDetail } from './pages/GameDetail';

function App() {
  // GitHub Pages 部署在子路径时，需要设置 basename
  const basename = import.meta.env.BASE_URL.replace(/\/$/, '') || undefined
  return (
    <AppProvider>
      <Router basename={basename}>
        <Layout>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/teams" element={<Teams />} />
            <Route path="/players" element={<Players />} />
            <Route path="/games" element={<Games />} />
            <Route path="/games/:gameId" element={<GameDetail />} />
          </Routes>
        </Layout>
      </Router>
    </AppProvider>
  );
}

export default App;
