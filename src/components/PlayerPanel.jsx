import { database } from '../firebase';
import { ref, push, set } from 'firebase/database';
import { useState, useRef, useEffect } from 'react'
import RoleReveal from './RoleReveal'
import { motion } from 'framer-motion'
import jsQR from 'jsqr'
import {
  Box, Typography, TextField, Button, Paper, Divider
} from '@mui/material'

function PlayerPanel() {
  const [shortCode, setShortCode] = useState('')
  const [playerNum, setPlayerNum] = useState('')
  const [game, setGame] = useState(null)
  const [myRole, setMyRole] = useState(null)
  const [isScanning, setIsScanning] = useState(false)
  const [playerName, setPlayerName] = useState('')
  const [hasJoined, setHasJoined] = useState(false)

  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const streamRef = useRef(null)
  const scanIntervalRef = useRef(null)

  // 解析短代碼
  const parseShortCode = (code) => {
    try {
      const decoded = decodeURIComponent(escape(atob(code)))
      const parts = decoded.split('|')

      let goodWord = '', traitorWord = '', traitorStr = '', totalStr = ''

      parts.forEach(part => {
        if (part.startsWith('g=')) goodWord = part.substring(2)
        if (part.startsWith('t=')) traitorWord = part.substring(2)
        if (part.startsWith('x=')) traitorStr = part.substring(2)
        if (part.startsWith('n=')) totalStr = part.substring(2)
      })

      const totalPlayers = parseInt(totalStr)
      const traitorNums = traitorStr ? traitorStr.split(',').map(n => parseInt(n)) : []

      const assignments = Array.from({ length: totalPlayers }, (_, i) => {
        const isTraitor = traitorNums.includes(i + 1)
        return {
          playerNum: i + 1,
          name: `Player ${i + 1}`,
          role: isTraitor ? '二五仔' : '好人',
          word: isTraitor ? traitorWord : goodWord
        }
      })

      return { totalPlayers, goodWord, traitorWord, assignments }
    } catch {
      alert('短代碼無效或已損壞！')
      return null
    }
  }

  const loadGame = (code = shortCode) => {
    if (!code.trim()) {
      alert('請輸入短代碼')
      return
    }
    const parsed = parseShortCode(code.trim())
    if (parsed) {
      setGame(parsed)
      setMyRole(null)
      stopScanning()
    }
  }

  const revealRole = () => {
    if (!game || !playerNum) {
      alert('請輸入玩家編號')
      return
    }
    const num = parseInt(playerNum)
    const roleInfo = game.assignments.find(a => a.playerNum === num)
    if (!roleInfo) {
      alert('編號唔正確！')
      return
    }
    setMyRole(roleInfo)
  }

  // 玩家輸入名字並加入遊戲
  const joinGame = async () => {
    if (!playerName.trim()) {
      alert('請輸入你嘅名字')
      return
    }

    try {
      const playersRef = ref(database, 'rooms/main-room/players')
      const newPlayerRef = push(playersRef)

      await set(newPlayerRef, {
        name: playerName.trim(),
        joinedAt: Date.now()
      })

      setHasJoined(true)
      alert('成功加入遊戲！請等待 Admin 生成 QR Code')
    } catch (error) {
      console.error('加入失敗:', error)
      alert('加入失敗，請重試')
    }
  }

  // 開始相機掃描
  const startScanning = async () => {
    try {
      setIsScanning(true)
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
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
          setShortCode(code.data)
          loadGame(code.data)
          stopScanning()
        }
      }, 400)
    } catch (err) {
      alert('無法開啟相機')
      setIsScanning(false)
      stopScanning()
    }
  }

  const stopScanning = () => {
    if (scanIntervalRef.current) clearInterval(scanIntervalRef.current)
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
    }
    setIsScanning(false)
  }

  useEffect(() => {
    return () => stopScanning()
  }, [])

  return (
    <Box sx={{ maxWidth: 480, mx: 'auto' }}>
      {/* Header */}
      <Box sx={{ textAlign: 'center', mb: 4 }}>
        <Typography variant="h4" fontWeight={700} gutterBottom>
          玩家查看角色
        </Typography>
        <Typography variant="body1" color="text.secondary">
          請使用相機掃描 QR Code，或手動輸入短代碼
        </Typography>
      </Box>

      {!myRole ? (
        <Paper
          component={motion.div}
          whileHover={{ y: -3 }}
          transition={{ duration: 0.2 }}
          sx={{ p: 3, borderRadius: 4 }}
        >
          {/* ===== 玩家輸入名字區域 ===== */}
          {!hasJoined && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" gutterBottom>
                請先輸入你嘅名字
              </Typography>
              <Box sx={{ display: 'flex', gap: 1.5 }}>
                <TextField
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  placeholder="例如：小明"
                  fullWidth
                />
                <Button 
                  variant="contained" 
                  onClick={joinGame}
                  sx={{ whiteSpace: 'nowrap' }}
                >
                  加入遊戲
                </Button>
              </Box>
            </Box>
          )}

          {hasJoined && (
            <Typography variant="body2" color="success.main" sx={{ mb: 2 }}>
              ✅ 你已成功加入遊戲！請等待 Admin 生成 QR Code
            </Typography>
          )}

          <Divider sx={{ my: 2 }} />

          {/* 相機掃描按鈕 */}
          <Button
            variant="contained"
            color="success"
            fullWidth
            size="large"
            onClick={isScanning ? stopScanning : startScanning}
            sx={{ mb: 3, py: 1.5, borderRadius: 3 }}
          >
            {isScanning ? '停止掃描' : '📷 用相機掃描 QR Code'}
          </Button>

          {/* 相機畫面 */}
          {isScanning && (
            <Box sx={{ mb: 3, borderRadius: 3, overflow: 'hidden', bgcolor: '#000' }}>
              <video ref={videoRef} style={{ width: '100%', display: 'block' }} />
              <canvas ref={canvasRef} style={{ display: 'none' }} />
            </Box>
          )}

          <Divider sx={{ my: 2 }} />

          {/* 手動輸入短代碼 */}
          <Typography variant="subtitle2" gutterBottom>
            或手動輸入短代碼
          </Typography>
          <Box sx={{ display: 'flex', gap: 1.5, mb: 3 }}>
            <TextField
              value={shortCode}
              onChange={(e) => setShortCode(e.target.value)}
              placeholder="g=蘋果|t=香蕉|x=2|n=7"
              fullWidth
            />
            <Button variant="contained" onClick={() => loadGame()}>
              載入
            </Button>
          </Box>

          {/* 輸入 Player 編號 */}
          {game && (
            <Box>
              <TextField
                label="你嘅 Player 編號"
                type="number"
                value={playerNum}
                onChange={(e) => setPlayerNum(e.target.value)}
                fullWidth
                sx={{ mb: 2 }}
              />
              <Button
                variant="contained"
                color="error"
                fullWidth
                size="large"
                onClick={revealRole}
                sx={{ py: 1.5, borderRadius: 3 }}
              >
                查看我的角色
              </Button>
            </Box>
          )}
        </Paper>
      ) : (
        <RoleReveal
          roleInfo={myRole}
          onReset={() => {
            setMyRole(null)
            setPlayerNum('')
            setShortCode('')
            setGame(null)
          }}
        />
      )}
    </Box>
  )
}

export default PlayerPanel