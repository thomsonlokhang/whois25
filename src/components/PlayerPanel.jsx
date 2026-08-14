import { database } from '../firebase'
import { ref, set, onDisconnect, onValue } from 'firebase/database'
import { useState, useRef, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import RoleReveal from './RoleReveal'
import HowToPlay from './HowToPlay'
import { motion } from 'framer-motion'
import jsQR from 'jsqr'
import {
  Alert,
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Divider,
  List,
  ListItem,
  ListItemText,
  Stack,
} from '@mui/material'
import { getOrCreatePlayerId, isValidRoomCode, normalizeRoomCode, parseRoomFromQr } from '../utils/room'

function PlayerPanel() {
  const [searchParams, setSearchParams] = useSearchParams()
  const urlRoom = normalizeRoomCode(searchParams.get('room') || '')
  const storedRoom = normalizeRoomCode(localStorage.getItem('whois25_roomCode') || '')
  const [roomInput, setRoomInput] = useState(undefined)
  const roomCode = roomInput !== undefined ? roomInput : (urlRoom || storedRoom)
  const [playerName, setPlayerName] = useState(() => localStorage.getItem('whois25_playerName') || '')
  const [playerId] = useState(() => getOrCreatePlayerId())
  const [hasJoined, setHasJoined] = useState(false)
  const [game, setGame] = useState(null)
  const [playersList, setPlayersList] = useState([])
  const [myRole, setMyRole] = useState(null)
  const [isScanning, setIsScanning] = useState(false)
  const [error, setError] = useState('')

  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const streamRef = useRef(null)
  const scanIntervalRef = useRef(null)

  const stopScanning = () => {
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current)
      scanIntervalRef.current = null
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
    setIsScanning(false)
  }

  useEffect(() => () => stopScanning(), [])

  useEffect(() => {
    if (!hasJoined || !isValidRoomCode(roomCode)) return undefined

    const playersRef = ref(database, `rooms/${roomCode}/players`)
    const unsubPlayers = onValue(playersRef, (snapshot) => {
      const data = snapshot.val()
      if (data) {
        const list = Object.keys(data).map((id) => ({ id, ...data[id] }))
        list.sort((a, b) => (a.joinedAt || 0) - (b.joinedAt || 0))
        setPlayersList(list)
      } else {
        setPlayersList([])
      }
    })

    const gameRef = ref(database, `rooms/${roomCode}/game`)
    const unsubGame = onValue(gameRef, (snapshot) => {
      const next = snapshot.exists() ? snapshot.val() : null
      setGame(next)
      if (!next) {
        setMyRole(null)
        return
      }
      const mine = (next.assignments || []).find((a) => a.playerId === playerId)
      if (!mine) setMyRole(null)
    })

    return () => {
      unsubPlayers()
      unsubGame()
    }
  }, [hasJoined, roomCode, playerId])

  const joinGame = async (codeOverride) => {
    const code = normalizeRoomCode(codeOverride || roomCode)
    const name = playerName.trim()
    if (!name) {
      setError('請輸入你嘅名字')
      return
    }
    if (!isValidRoomCode(code)) {
      setError('請輸入 4 位房間碼，或掃描 Host 嘅 QR')
      return
    }

    try {
      setError('')
      const playerRef = ref(database, `rooms/${code}/players/${playerId}`)
      await set(playerRef, {
        name,
        joinedAt: Date.now(),
      })
      onDisconnect(playerRef).remove()

      setRoomInput(code)
      setHasJoined(true)
      localStorage.setItem('whois25_playerName', name)
      localStorage.setItem('whois25_roomCode', code)
      setSearchParams({ room: code }, { replace: true })
    } catch (err) {
      console.error('加入失敗:', err)
      setError('加入失敗，請檢查房間碼同網絡')
    }
  }

  const startScanning = async () => {
    try {
      setIsScanning(true)
      setError('')
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }

      scanIntervalRef.current = setInterval(() => {
        const video = videoRef.current
        const canvas = canvasRef.current
        if (!video || !canvas || video.readyState !== 4) return

        const ctx = canvas.getContext('2d', { willReadFrequently: true })
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
        const code = jsQR(imageData.data, imageData.width, imageData.height)
        if (code) {
          const parsed = parseRoomFromQr(code.data)
          if (parsed) {
            setRoomInput(parsed)
            stopScanning()
            joinGame(parsed)
          }
        }
      }, 350)
    } catch {
      setError('無法開啟相機，請改為手動輸入房間碼')
      stopScanning()
    }
  }

  const revealMine = () => {
    if (!game) return
    const mine = (game.assignments || []).find((a) => a.playerId === playerId)
    if (mine) {
      setMyRole(mine)
    } else {
      setError('你唔喺呢局嘅分配入面。可能你加入得太遲，請叫 Host 重新生成。')
    }
  }

  if (myRole) {
    return (
      <RoleReveal
        roleInfo={myRole}
        onReset={() => setMyRole(null)}
      />
    )
  }

  return (
    <Box sx={{ maxWidth: 480, mx: 'auto' }}>
      <Typography variant="h4" fontWeight={700} textAlign="center" sx={{ mb: 3 }}>
        玩家入場
      </Typography>

      <Box sx={{ mb: 2 }}>
        <HowToPlay />
      </Box>

      <Paper component={motion.div} whileHover={{ y: -3 }} sx={{ p: 3, borderRadius: 4 }}>
        {!hasJoined ? (
          <>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              輸入 Host 報嘅房間碼，或者直接掃佢個 QR。
            </Typography>
            <Stack spacing={2}>
              <TextField
                label="你嘅名字"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                placeholder="例如：小明"
                fullWidth
              />
              <TextField
                label="房間碼"
                value={roomCode}
                onChange={(e) => setRoomInput(normalizeRoomCode(e.target.value))}
                placeholder="例如：A7K2"
                inputProps={{ maxLength: 8, style: { letterSpacing: '0.2em', fontWeight: 700 } }}
                fullWidth
              />
              <Button variant="contained" size="large" onClick={() => joinGame()}>
                加入遊戲
              </Button>
              <Button
                variant="outlined"
                color="success"
                size="large"
                onClick={isScanning ? stopScanning : startScanning}
              >
                {isScanning ? '停止掃描' : '掃描 QR Code'}
              </Button>
            </Stack>
            {isScanning && (
              <Box sx={{ mt: 2, borderRadius: 3, overflow: 'hidden', bgcolor: '#000' }}>
                <video ref={videoRef} style={{ width: '100%', display: 'block' }} playsInline muted />
                <canvas ref={canvasRef} style={{ display: 'none' }} />
              </Box>
            )}
          </>
        ) : (
          <>
            <Alert severity="success" sx={{ mb: 2 }}>
              你已加入房間 <b>{roomCode}</b>
              {playerName ? `（${playerName}）` : ''}。關閉或重新整理頁面會暫時離開。
            </Alert>

            <Typography variant="subtitle2" gutterBottom>
              房間入面而家有 {playersList.length} 人
            </Typography>
            <Paper variant="outlined" sx={{ maxHeight: 200, overflow: 'auto', mb: 2 }}>
              <List dense>
                {playersList.map((player, index) => (
                  <ListItem key={player.id}>
                    <ListItemText
                      primary={`${index + 1}. ${player.name}${player.id === playerId ? '（你）' : ''}`}
                    />
                  </ListItem>
                ))}
              </List>
            </Paper>

            <Divider sx={{ my: 2 }} />

            {!game ? (
              <Typography variant="body2" color="text.secondary">
                等 Host 揀題目同生成分配。生成之後呢度會出現「查看我嘅角色」。
              </Typography>
            ) : (
              <Box>
                <Typography variant="body2" sx={{ mb: 1.5 }}>
                  遊戲已開始。睇之前確認隔離無人望住你個螢幕。
                </Typography>
                <Button variant="contained" color="success" size="large" fullWidth onClick={revealMine}>
                  查看我嘅角色
                </Button>
              </Box>
            )}
          </>
        )}

        {error && (
          <Alert severity="error" sx={{ mt: 2 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}
      </Paper>
    </Box>
  )
}

export default PlayerPanel
