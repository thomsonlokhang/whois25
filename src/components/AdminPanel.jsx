import { database } from '../firebase'
import { ref, onValue, set, remove } from 'firebase/database'
import { useState, useEffect } from 'react'
import QRCode from 'qrcode'
import {
  Alert,
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Divider,
  Stack,
  Collapse,
} from '@mui/material'
import { motion } from 'framer-motion'
import HowToPlay from './HowToPlay'
import WordPairPicker from './WordPairPicker'
import { suggestedTraitorCount } from '../wordPairs'
import { generateRoomCode, playerPageUrl } from '../utils/room'

const HOST_ROOM_KEY = 'whois25_host_room'

function AdminPanel() {
  const [roomCode, setRoomCode] = useState(() => {
    return sessionStorage.getItem(HOST_ROOM_KEY) || generateRoomCode()
  })
  const [numTraitors, setNumTraitors] = useState(1)
  const [goodWord, setGoodWord] = useState('蘋果')
  const [traitorWord, setTraitorWord] = useState('梨')
  const [game, setGame] = useState(null)
  const [qrCodeUrl, setQrCodeUrl] = useState('')
  const [players, setPlayers] = useState([])
  const [showTable, setShowTable] = useState(false)
  const [copyHint, setCopyHint] = useState('')

  useEffect(() => {
    sessionStorage.setItem(HOST_ROOM_KEY, roomCode)
  }, [roomCode])

  useEffect(() => {
    const playersRef = ref(database, `rooms/${roomCode}/players`)
    const unsubPlayers = onValue(playersRef, (snapshot) => {
      const data = snapshot.val()
      if (data) {
        const list = Object.keys(data).map((id) => ({ id, ...data[id] }))
        list.sort((a, b) => (a.joinedAt || 0) - (b.joinedAt || 0))
        setPlayers(list)
      } else {
        setPlayers([])
      }
    })

    const gameRef = ref(database, `rooms/${roomCode}/game`)
    const unsubGame = onValue(gameRef, (snapshot) => {
      setGame(snapshot.exists() ? snapshot.val() : null)
    })

    return () => {
      unsubPlayers()
      unsubGame()
    }
  }, [roomCode])

  useEffect(() => {
    const url = playerPageUrl(roomCode)
    QRCode.toDataURL(url, { width: 280, margin: 2 })
      .then(setQrCodeUrl)
      .catch((err) => console.error(err))
  }, [roomCode])

  const toast = (msg) => {
    setCopyHint(msg)
    window.setTimeout(() => setCopyHint(''), 1800)
  }

  const copyText = async (text, okMsg) => {
    try {
      await navigator.clipboard.writeText(text)
      toast(okMsg)
    } catch {
      window.prompt('請手動複製：', text)
    }
  }

  const newRoom = () => {
    if (game && !window.confirm('開新房會離開而家呢局。確定？')) return
    const next = generateRoomCode()
    setRoomCode(next)
    setGame(null)
    setShowTable(false)
  }

  const generateGame = async () => {
    const g = goodWord.trim()
    const t = traitorWord.trim()
    if (!g || !t) {
      alert('請輸入好人題目同二五仔題目！')
      return
    }
    if (g === t) {
      alert('兩個題目唔可以完全一樣，否則冇人分到邊個係二五仔。')
      return
    }
    if (players.length < 3) {
      alert('至少要 3 個玩家加入先好開局。')
      return
    }
    if (numTraitors < 1 || numTraitors >= players.length) {
      alert('二五仔數量要至少 1，而且少過總人數。')
      return
    }

    const indices = Array.from({ length: players.length }, (_, i) => i)
    for (let i = indices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[indices[i], indices[j]] = [indices[j], indices[i]]
    }
    const traitorSet = new Set(indices.slice(0, numTraitors))

    const assignments = players.map((p, i) => ({
      playerNum: i + 1,
      playerId: p.id,
      name: p.name,
      role: traitorSet.has(i) ? '二五仔' : '好人',
      word: traitorSet.has(i) ? t : g,
    }))

    const newGame = {
      totalPlayers: players.length,
      numTraitors,
      goodWord: g,
      traitorWord: t,
      assignments,
      generatedAt: Date.now(),
    }

    try {
      await set(ref(database, `rooms/${roomCode}/game`), newGame)
      setShowTable(false)
    } catch (error) {
      console.error('儲存遊戲失敗:', error)
      alert('儲存遊戲失敗，請檢查網絡後重試')
    }
  }

  const resetRound = async () => {
    try {
      await remove(ref(database, `rooms/${roomCode}/game`))
      setShowTable(false)
    } catch (error) {
      console.error(error)
      alert('清除失敗')
    }
  }

  const joinUrl = playerPageUrl(roomCode)

  return (
    <Box sx={{ maxWidth: 1100, mx: 'auto' }}>
      <Box sx={{ mb: 3, textAlign: 'center' }}>
        <Typography variant="h4" fontWeight={700}>
          Host 控制台
        </Typography>
        <Typography variant="body1" color="text.secondary">
          等玩家加入之後揀題目，再生成分配
        </Typography>
      </Box>

      <Box sx={{ mb: 3 }}>
        <HowToPlay />
      </Box>

      <Paper
        component={motion.div}
        whileHover={{ y: -3 }}
        transition={{ duration: 0.2 }}
        sx={{ p: 3, borderRadius: 4, mb: 3 }}
      >
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          spacing={3}
          alignItems={{ xs: 'stretch', md: 'center' }}
        >
          <Box sx={{ flex: 1 }}>
            <Typography variant="overline" color="text.secondary">
              房間碼
            </Typography>
            <Typography variant="h3" fontWeight={800} sx={{ letterSpacing: '0.18em', lineHeight: 1.1 }}>
              {roomCode}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1, mb: 2 }}>
              叫玩家打開「玩家」頁，輸入呢個碼；或者掃右邊 QR，會直接入場。
            </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              <Button size="small" variant="contained" onClick={() => copyText(roomCode, '房間碼已複製')}>
                複製房間碼
              </Button>
              <Button size="small" variant="outlined" onClick={() => copyText(joinUrl, '玩家連結已複製')}>
                複製玩家連結
              </Button>
              <Button size="small" onClick={newRoom}>
                開新房
              </Button>
            </Stack>
            {copyHint && (
              <Typography variant="caption" color="success.main" sx={{ display: 'block', mt: 1 }}>
                {copyHint}
              </Typography>
            )}
          </Box>
          {qrCodeUrl && (
            <Box textAlign="center">
              <img
                src={qrCodeUrl}
                alt={`房間 ${roomCode} 的 QR Code`}
                style={{ background: 'white', padding: 10, borderRadius: 12, width: 168, height: 168 }}
              />
              <Typography variant="caption" color="text.secondary" display="block">
                掃完會去玩家頁
              </Typography>
            </Box>
          )}
        </Stack>
      </Paper>

      <Paper
        component={motion.div}
        whileHover={{ y: -3 }}
        transition={{ duration: 0.2 }}
        sx={{ p: 3, borderRadius: 4, mb: 3 }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, gap: 2, flexWrap: 'wrap' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Typography variant="h6">已加入玩家</Typography>
            <Chip
              label={`${players.length} 人`}
              color={players.length >= 3 ? 'success' : 'default'}
              size="small"
            />
          </Box>
          <Chip
            label={players.length > 0 ? '即時更新中' : '等待玩家加入'}
            color={players.length > 0 ? 'success' : 'default'}
            size="small"
            variant="outlined"
          />
        </Box>

        {players.length === 0 ? (
          <Box sx={{ py: 4, textAlign: 'center', bgcolor: 'action.hover', borderRadius: 2 }}>
            <Typography variant="body1" color="text.secondary">
              暫時未有人加入
            </Typography>
            <Typography variant="body2" color="text.disabled" sx={{ mt: 1 }}>
              請玩家去「玩家」頁輸入房間碼 {roomCode} 同自己個名
            </Typography>
          </Box>
        ) : (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ width: 60 }}>#</TableCell>
                  <TableCell>玩家名字</TableCell>
                  <TableCell align="right">加入時間</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {players.map((player, index) => (
                  <TableRow key={player.id} hover>
                    <TableCell>
                      <Chip label={index + 1} size="small" color="primary" variant="outlined" />
                    </TableCell>
                    <TableCell sx={{ fontWeight: 500 }}>{player.name}</TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" color="text.secondary">
                        {player.joinedAt ? new Date(player.joinedAt).toLocaleTimeString('zh-HK') : '—'}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: '280px 1fr' },
          gap: 3,
          mb: 3,
        }}
      >
        <Paper component={motion.div} whileHover={{ y: -3 }} transition={{ duration: 0.2 }} sx={{ p: 3, borderRadius: 4 }}>
          <Typography variant="h6" gutterBottom>
            遊戲設定
          </Typography>
          <Stack spacing={2.5}>
            <TextField
              label="二五仔數量"
              type="number"
              value={numTraitors}
              onChange={(e) => setNumTraitors(parseInt(e.target.value, 10) || 1)}
              helperText={
                players.length > 0
                  ? `${players.length} 人建議 ${suggestedTraitorCount(players.length)} 個二五仔`
                  : '等人齊之後先開局'
              }
              inputProps={{ min: 1, max: Math.max(players.length - 1, 1) }}
              fullWidth
            />
            <TextField
              label="好人題目"
              value={goodWord}
              onChange={(e) => setGoodWord(e.target.value)}
              fullWidth
            />
            <TextField
              label="二五仔題目"
              value={traitorWord}
              onChange={(e) => setTraitorWord(e.target.value)}
              fullWidth
            />
            {goodWord.trim() && traitorWord.trim() && goodWord.trim() === traitorWord.trim() && (
              <Alert severity="warning">兩個詞而家一模一樣，生成前請改一改。</Alert>
            )}
            <Button
              variant="contained"
              size="large"
              onClick={generateGame}
              disabled={players.length < 3}
              sx={{ py: 1.5, fontWeight: 700 }}
            >
              生成公平隨機分配
            </Button>
          </Stack>
        </Paper>

        <Paper component={motion.div} whileHover={{ y: -3 }} transition={{ duration: 0.2 }} sx={{ p: 3, borderRadius: 4 }}>
          <Typography variant="h6" gutterBottom>
            題目庫
          </Typography>
          <WordPairPicker
            goodWord={goodWord}
            traitorWord={traitorWord}
            onSelect={(g, t) => {
              setGoodWord(g)
              setTraitorWord(t)
            }}
          />
        </Paper>
      </Box>

      {game && (
        <Paper component={motion.div} whileHover={{ y: -3 }} transition={{ duration: 0.2 }} sx={{ p: 3, borderRadius: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap', mb: 2 }}>
            <Box>
              <Typography variant="h6">呢局已生成</Typography>
              <Typography variant="body2" color="text.secondary">
                玩家手機而家可以查看自己嘅角色。分配表只有你睇。
              </Typography>
            </Box>
            <Stack direction="row" spacing={1}>
              <Chip label={`${game.totalPlayers - game.numTraitors} 好人`} color="success" />
              <Chip label={`${game.numTraitors} 二五仔`} color="error" />
            </Stack>
          </Box>

          <Typography variant="body2" sx={{ mb: 2 }}>
            好人題目：<b>{game.goodWord}</b>
            {'  ·  '}
            二五仔題目：<b>{game.traitorWord}</b>
          </Typography>

          <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
            <Button variant="outlined" onClick={() => setShowTable((v) => !v)}>
              {showTable ? '收起分配表' : '顯示分配表（只有 Host 睇）'}
            </Button>
            <Button color="warning" onClick={resetRound}>
              清除呢局重來
            </Button>
          </Stack>

          <Collapse in={showTable}>
            <Divider sx={{ mb: 2 }} />
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>編號</TableCell>
                    <TableCell>玩家</TableCell>
                    <TableCell>角色</TableCell>
                    <TableCell>題目</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {game.assignments.map((a) => (
                    <TableRow key={a.playerId || a.playerNum}>
                      <TableCell>{a.playerNum}</TableCell>
                      <TableCell>{a.name}</TableCell>
                      <TableCell>
                        <Chip label={a.role} color={a.role === '好人' ? 'success' : 'error'} size="small" />
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>{a.word}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Collapse>
        </Paper>
      )}
    </Box>
  )
}

export default AdminPanel
