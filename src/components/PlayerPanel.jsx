import { database } from '../firebase';
import { ref, onValue, off, get } from 'firebase/database';
import { useState, useRef, useEffect } from 'react'
import RoleReveal from './RoleReveal'
import { motion } from 'framer-motion'
import jsQR from 'jsqr'
import {
  Box, Typography, TextField, Button, Paper, Divider, List, ListItem, ListItemButton, ListItemText
} from '@mui/material'

function PlayerPanel() {
  const [shortCode, setShortCode] = useState('')
  const [game, setGame] = useState(null)
  const [myRole, setMyRole] = useState(null)
  const [isScanning, setIsScanning] = useState(false)
  const [playerName, setPlayerName] = useState('')
  const [hasJoined, setHasJoined] = useState(false)
  const [playersList, setPlayersList] = useState([])

  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const streamRef = useRef(null)
  const scanIntervalRef = useRef(null)

  // 載入遊戲資料（從 Firebase）
  const loadGameFromFirebase = async (roomId = 'main-room') => {
    try {
      const gameRef = ref(database, `rooms/${roomId}/game`);
      const snapshot = await get(gameRef);

      if (snapshot.exists()) {
        const gameData = snapshot.val();
        setGame(gameData);

        // 同時載入玩家列表
        const playersRef = ref(database, `rooms/${roomId}/players`);
        const playersSnapshot = await get(playersRef);
        if (playersSnapshot.exists()) {
          const playersData = playersSnapshot.val();
          const list = Object.keys(playersData).map(key => ({
            id: key,
            ...playersData[key]
          }));
          setPlayersList(list);
        }
      } else {
        alert('遊戲尚未生成，請等待 Admin 生成後再掃描');
      }
    } catch (error) {
      console.error('載入遊戲失敗:', error);
      alert('載入遊戲失敗');
    }
  };

  // 玩家選擇自己後直接顯示角色
  const selectPlayer = (selectedPlayer) => {
    if (!game) return;

    const roleInfo = game.assignments.find(a => a.name === selectedPlayer.name);
    if (roleInfo) {
      setMyRole(roleInfo);
    } else {
      alert('找不到你嘅角色資料');
    }
  };

  // 開始相機掃描
  const startScanning = async () => {
    try {
      setIsScanning(true);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      scanIntervalRef.current = setInterval(() => {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        if (!video || !canvas || video.readyState !== 4) return;

        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height);

        if (code) {
          // 掃描到 QR Code 後
          if (code.data === 'main-room') {
            loadGameFromFirebase('main-room');
          } else {
            // 兼容舊短代碼
            setShortCode(code.data);
            // loadGame(code.data); // 如果需要兼容舊版可打開
          }
          stopScanning();
        }
      }, 400);
    } catch (err) {
      alert('無法開啟相機');
      setIsScanning(false);
      stopScanning();
    }
  };

  const stopScanning = () => {
    if (scanIntervalRef.current) clearInterval(scanIntervalRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    setIsScanning(false);
  };

  useEffect(() => {
    return () => stopScanning();
  }, []);

  return (
    <Box sx={{ maxWidth: 480, mx: 'auto' }}>
      <Box sx={{ textAlign: 'center', mb: 4 }}>
        <Typography variant="h4" fontWeight={700} gutterBottom>
          玩家查看角色
        </Typography>
      </Box>

      {!myRole ? (
        <Paper component={motion.div} whileHover={{ y: -3 }} sx={{ p: 3, borderRadius: 4 }}>
          
          {/* 玩家已加入提示 */}
          {hasJoined && (
            <Typography variant="body2" color="success.main" sx={{ mb: 2 }}>
              ✅ 你已成功加入遊戲
            </Typography>
          )}

          {/* 相機掃描 */}
          <Button
            variant="contained"
            color="success"
            fullWidth
            size="large"
            onClick={isScanning ? stopScanning : startScanning}
            sx={{ mb: 3, py: 1.5, borderRadius: 3 }}
          >
            {isScanning ? '停止掃描' : '📷 掃描 QR Code'}
          </Button>

          {isScanning && (
            <Box sx={{ mb: 3, borderRadius: 3, overflow: 'hidden', bgcolor: '#000' }}>
              <video ref={videoRef} style={{ width: '100%', display: 'block' }} />
              <canvas ref={canvasRef} style={{ display: 'none' }} />
            </Box>
          )}

          <Divider sx={{ my: 2 }} />

          {/* 顯示玩家列表讓玩家選擇自己 */}
          {game && playersList.length > 0 && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" gutterBottom>
                請選擇你係邊個玩家
              </Typography>
              <Paper variant="outlined" sx={{ maxHeight: 300, overflow: 'auto' }}>
                <List>
                  {playersList.map((player, index) => (
                    <ListItem key={player.id} disablePadding>
                      <ListItemButton onClick={() => selectPlayer(player)}>
                        <ListItemText 
                          primary={`${index + 1}. ${player.name}`} 
                        />
                      </ListItemButton>
                    </ListItem>
                  ))}
                </List>
              </Paper>
            </Box>
          )}

          {/* 手動輸入短代碼（兼容） */}
          {!game && (
            <Box>
              <Typography variant="subtitle2" gutterBottom>
                或手動輸入短代碼
              </Typography>
              <Box sx={{ display: 'flex', gap: 1.5 }}>
                <TextField
                  value={shortCode}
                  onChange={(e) => setShortCode(e.target.value)}
                  placeholder="輸入短代碼"
                  fullWidth
                />
                <Button variant="contained" onClick={() => loadGameFromFirebase('main-room')}>
                  載入
                </Button>
              </Box>
            </Box>
          )}
        </Paper>
      ) : (
        <RoleReveal
          roleInfo={myRole}
          onReset={() => {
            setMyRole(null);
            setGame(null);
            setPlayersList([]);
          }}
        />
      )}
    </Box>
  );
}

export default PlayerPanel