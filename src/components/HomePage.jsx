import { Link as RouterLink } from 'react-router-dom'
import { Box, Button, Paper, Stack, Typography } from '@mui/material'
import { motion } from 'framer-motion'

const STEPS = [
  {
    n: '01',
    title: 'Host 開房',
    text: '入控制台會自動產生房間碼同 QR Code。',
  },
  {
    n: '02',
    title: '玩家加入',
    text: '掃 QR 或輸入房間碼，填自己個名。',
  },
  {
    n: '03',
    title: '派詞開波',
    text: 'Host 揀一對相似題目，生成之後每人只睇到自己嘅詞。',
  },
]

function HomePage() {
  return (
    <Box sx={{ maxWidth: 880, mx: 'auto' }}>
      <Box
        component={motion.div}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        sx={{ textAlign: 'center', mb: 5 }}
      >
        <Box
          sx={{
            width: 72,
            height: 72,
            mx: 'auto',
            mb: 2.5,
            borderRadius: '22px',
            background: 'linear-gradient(135deg, #6750A4 0%, #9A7FCF 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontWeight: 800,
            fontSize: '1.8rem',
            boxShadow: '0 10px 32px rgba(103, 80, 164, 0.4)',
          }}
        >
          25
        </Box>
        <Typography variant="h3" fontWeight={800} sx={{ letterSpacing: '-0.03em' }}>
          誰是二五仔
        </Typography>
        <Typography
          variant="h6"
          color="text.secondary"
          sx={{ mt: 1.5, maxWidth: 520, mx: 'auto', fontWeight: 400 }}
        >
          粵語派對卧底遊戲。好人同一句詞，二五仔攞一個好相似嘅詞。描述、投票、揭穿佢。
        </Typography>
      </Box>

      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={2}
        justifyContent="center"
        sx={{ mb: 5 }}
      >
        <Button
          component={RouterLink}
          to="/admin"
          variant="contained"
          size="large"
          sx={{ px: 4, py: 1.5, fontSize: '1.05rem' }}
        >
          我係 Host
        </Button>
        <Button
          component={RouterLink}
          to="/player"
          variant="outlined"
          size="large"
          sx={{ px: 4, py: 1.5, fontSize: '1.05rem' }}
        >
          我係玩家
        </Button>
      </Stack>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: '1fr 1fr 1fr' },
          gap: 2,
          mb: 4,
        }}
      >
        {STEPS.map((step, i) => (
          <Paper
            key={step.n}
            component={motion.div}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 * i }}
            sx={{ p: 2.5, borderRadius: 4 }}
          >
            <Typography variant="overline" color="primary.main" fontWeight={700}>
              {step.n}
            </Typography>
            <Typography variant="h6" fontWeight={700} sx={{ mb: 0.75 }}>
              {step.title}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {step.text}
            </Typography>
          </Paper>
        ))}
      </Box>

      <Paper sx={{ p: 3, borderRadius: 4 }}>
        <Typography variant="h6" fontWeight={700} gutterBottom>
          場內點玩
        </Typography>
        <Box component="ol" sx={{ m: 0, pl: 2.5, color: 'text.secondary' }}>
          <Typography component="li" variant="body2" sx={{ mb: 1 }}>
            每人輪流用一句話描述自己嘅題目，唔可以講出個詞、諧音或拆字。
          </Typography>
          <Typography component="li" variant="body2" sx={{ mb: 1 }}>
            聽完一圈之後討論，再投票淘汰一個最可疑嘅人。
          </Typography>
          <Typography component="li" variant="body2">
            投中二五仔 → 好人贏。二五仔撐到最後或估中好人題目 → 二五仔贏。
          </Typography>
        </Box>
        <Typography variant="caption" color="text.disabled" sx={{ display: 'block', mt: 2 }}>
          題目一定要「似但唔同」。如果兩個詞其實係同一樣嘢（例如太平山頂同山頂），呢局就冇得玩。
        </Typography>
      </Paper>
    </Box>
  )
}

export default HomePage
