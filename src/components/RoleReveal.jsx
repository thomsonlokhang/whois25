import { motion } from 'framer-motion'
import { Box, Typography, Button, Paper, Chip } from '@mui/material'

function RoleReveal({ roleInfo, onReset }) {
  const isGood = roleInfo.role === '好人'

  return (
    <Box sx={{ maxWidth: 420, mx: 'auto', textAlign: 'center' }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.8, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{
          type: 'spring',
          stiffness: 260,
          damping: 20,
        }}
      >
        <Paper
          elevation={0}
          sx={{
            p: 4,
            borderRadius: 4,
            bgcolor: isGood ? '#1B3A2F' : '#3A1F1F',
            color: 'white',
            overflow: 'hidden',
          }}
        >
          <Box sx={{ mb: 3 }}>
            <Chip
              label={roleInfo.role}
              color={isGood ? 'success' : 'error'}
              sx={{ fontSize: 18, height: 40, px: 2, fontWeight: 700 }}
            />
          </Box>

          <Typography variant="overline" sx={{ opacity: 0.7, letterSpacing: 3 }}>
            你係
          </Typography>
          <Typography variant="h3" fontWeight={800} gutterBottom>
            {roleInfo.role}
          </Typography>

          <Typography variant="body1" sx={{ opacity: 0.7, mb: 1 }}>
            你嘅題目係
          </Typography>

          <Typography variant="h4" fontWeight={700} sx={{ mb: 3 }}>
            {roleInfo.word}
          </Typography>

          <Typography variant="body2" sx={{ opacity: 0.65, maxWidth: 280, mx: 'auto' }}>
            {isGood
              ? '描述題目但唔可以講出嚟。同時要聽出邊個講得唔似，搵出二五仔。'
              : '你係二五仔。聽其他人點描述，盡量跟住講，唔好露出你個詞唔同。'}
          </Typography>
        </Paper>
      </motion.div>

      <Button
        variant="outlined"
        size="large"
        onClick={onReset}
        sx={{ mt: 3, px: 5, borderRadius: 3 }}
      >
        隱藏畫面
      </Button>

      <Typography variant="caption" color="error" sx={{ display: 'block', mt: 2 }}>
        記住唔好俾人見到你個畫面
      </Typography>
    </Box>
  )
}

export default RoleReveal
