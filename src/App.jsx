import { NavLink, Routes, Route } from 'react-router-dom'
import { AppBar, Toolbar, Typography, Box, Button } from '@mui/material'
import HomePage from './components/HomePage'
import AdminPanel from './components/AdminPanel'
import PlayerPanel from './components/PlayerPanel'

const navLinkSx = {
  color: 'text.secondary',
  fontWeight: 500,
  minWidth: 0,
  px: { xs: 1.25, sm: 1.75 },
  '&.active': {
    color: 'primary.main',
    fontWeight: 700,
  },
}

function App() {
  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <AppBar
        position="sticky"
        color="default"
        elevation={0}
        sx={{
          borderBottom: '1px solid #2C2930',
          bgcolor: 'background.paper',
        }}
      >
        <Toolbar sx={{ gap: 1, minHeight: 64 }}>
          <Box
            component={NavLink}
            to="/"
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1.25,
              textDecoration: 'none',
              color: 'inherit',
              mr: 'auto',
            }}
          >
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
                fontSize: '1.05rem',
              }}
            >
              25
            </Box>
            <Typography variant="h6" fontWeight={700} sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}>
              誰是二五仔
            </Typography>
          </Box>

          <Button component={NavLink} to="/" end sx={navLinkSx}>
            首頁
          </Button>
          <Button component={NavLink} to="/admin" sx={navLinkSx}>
            Host
          </Button>
          <Button component={NavLink} to="/player" sx={navLinkSx}>
            玩家
          </Button>
        </Toolbar>
      </AppBar>

      <Box sx={{ px: { xs: 2, sm: 3 }, py: { xs: 3, md: 5 } }}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/admin" element={<AdminPanel />} />
          <Route path="/player" element={<PlayerPanel />} />
          <Route path="*" element={<HomePage />} />
        </Routes>
      </Box>
    </Box>
  )
}

export default App
