import { Routes, Route, Navigate } from 'react-router-dom'
import { AppBar, Toolbar, Typography, Box } from '@mui/material'
import AdminPanel from './components/AdminPanel'
import PlayerPanel from './components/PlayerPanel'

function App() {
  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* ===== AppBar Header ===== */}
      <AppBar 
        position="static" 
        color="default" 
        elevation={0}
        sx={{ 
          borderBottom: '1px solid #2C2930',
          bgcolor: 'background.paper'
        }}
      >
        <Toolbar sx={{ justifyContent: 'center', minHeight: '64px' }}>
          
          {/* Logo + 標題（一齊置中） */}
          <Box 
            sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 1.5,
              position: 'absolute',
              left: '50%',
              transform: 'translateX(-50%)'
            }}
          >
            {/* Logo */}
            <Box
              sx={{
                width: 36,
                height: 36,
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #6750A4 0%, #9A7FCF 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontWeight: 700,
                fontSize: '1.1rem'
              }}
            >
              25
            </Box>

            {/* 遊戲名稱 */}
            <Typography variant="h6" fontWeight={700}>
              誰是二五仔
            </Typography>
          </Box>

        </Toolbar>
      </AppBar>

      {/* ===== 頁面內容 ===== */}
      <Routes>
        <Route path="/admin" element={<AdminPanel />} />
        <Route path="/player" element={<PlayerPanel />} />
        <Route path="*" element={<Navigate to="/admin" replace />} />
      </Routes>
    </Box>
  )
}

export default App