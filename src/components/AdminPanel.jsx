import { database } from '../firebase';
import { ref, onValue, off, set } from 'firebase/database';
import { useState, useEffect } from 'react'
import QRCode from 'qrcode'
import {
    Box, Typography, TextField, Button, Paper, Table, TableBody, TableCell,
    TableContainer, TableHead, TableRow, Chip, Divider, Grid
} from '@mui/material'
import { motion } from 'framer-motion'

function AdminPanel() {
    const [totalPlayers, setTotalPlayers] = useState(7)
    const [numTraitors, setNumTraitors] = useState(1)
    const [playerNames, setPlayerNames] = useState('')
    const [goodWord, setGoodWord] = useState('蘋果')
    const [traitorWord, setTraitorWord] = useState('香蕉')
    const [game, setGame] = useState(null)
    const [qrCodeUrl, setQrCodeUrl] = useState('')
    const [players, setPlayers] = useState([]);

    // 即時監聽玩家列表
    useEffect(() => {
        const playersRef = ref(database, 'rooms/main-room/players');
        const unsubscribe = onValue(playersRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                const playersList = Object.keys(data).map(key => ({
                    id: key,
                    ...data[key]
                }));
                playersList.sort((a, b) => a.joinedAt - b.joinedAt);
                setPlayers(playersList);
            } else {
                setPlayers([]);
            }
        });
        return () => off(playersRef, 'value', unsubscribe);
    }, []);

    const wordPairs = [ /* ... 你原本嘅 wordPairs ... */ ];

    const randomizeTopic = () => { /* ... */ };

    const generateShortCode = (gameData) => {
        const traitorNums = gameData.assignments
            .filter(a => a.role === '二五仔')
            .map(a => a.playerNum)
            .join(',')
        return btoa(unescape(encodeURIComponent(
            `g=${gameData.goodWord}|t=${gameData.traitorWord}|x=${traitorNums}|n=${gameData.totalPlayers}`
        )));
    }

    const generateQRCodeImage = async (text) => {
        try {
            const url = await QRCode.toDataURL(text, { width: 280, margin: 2 });
            setQrCodeUrl(url);
        } catch (err) {
            console.error(err);
        }
    }

    const generateGame = async () => {
        if (numTraitors >= totalPlayers) {
            alert('二五仔數量唔可以大過或等於總人數！');
            return;
        }

        // 使用 Firebase 玩家列表（如果有）
        let finalPlayers = players.length > 0 
            ? players.map(p => p.name) 
            : (playerNames.trim() ? playerNames.split('\n').map(n => n.trim()).filter(Boolean) : []);

        while (finalPlayers.length < totalPlayers) {
            finalPlayers.push(`Player ${finalPlayers.length + 1}`);
        }
        finalPlayers = finalPlayers.slice(0, totalPlayers);

        // 隨機分配
        const indices = Array.from({ length: totalPlayers }, (_, i) => i);
        for (let i = indices.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [indices[i], indices[j]] = [indices[j], indices[i]];
        }

        const traitorSet = new Set(indices.slice(0, numTraitors));

        const assignments = finalPlayers.map((name, i) => ({
            playerNum: i + 1,
            name,
            role: traitorSet.has(i) ? '二五仔' : '好人',
            word: traitorSet.has(i) ? traitorWord : goodWord
        }));

        const newGame = {
            totalPlayers,
            numTraitors,
            goodWord,
            traitorWord,
            assignments,
            shortCode: generateShortCode({ goodWord, traitorWord, assignments, totalPlayers })
        };

        setGame(newGame);
        generateQRCodeImage("main-room"); // ← 之後 QR Code 只放房間 ID

        // ===== 將遊戲資料存到 Firebase（為之後直接顯示角色做準備） =====
        try {
            const gameRef = ref(database, 'rooms/main-room/game');
            await set(gameRef, {
                ...newGame,
                generatedAt: Date.now()
            });
            alert("遊戲已生成並儲存到 Firebase！");
        } catch (error) {
            console.error("儲存遊戲失敗:", error);
        }
    };

    return (
        <Box sx={{ maxWidth: 1100, mx: 'auto' }}>
            {/* Header */}
            <Box sx={{ mb: 5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2.5, mb: 1.5 }}>
                    <Box sx={{
                        width: 52, height: 52, borderRadius: '16px',
                        background: 'linear-gradient(135deg, #6750A4 0%, #9A7FCF 100%)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: 'white', fontSize: '1.6rem', fontWeight: 700,
                        boxShadow: '0 4px 20px rgba(103, 80, 164, 0.35)'
                    }}>
                        25
                    </Box>
                    <Box>
                        <Typography variant="h4" fontWeight={700}>Admin 控制台</Typography>
                        <Typography variant="body1" color="text.secondary">
                            設定遊戲參數後生成分配，然後將短代碼或 QR Code 分享畀玩家
                        </Typography>
                    </Box>
                </Box>
            </Box>

            {/* 即時玩家列表 */}
            <Paper sx={{ p: 3, borderRadius: 4, mb: 4 }}>
                <Typography variant="h6" gutterBottom>
                    已加入玩家 ({players.length})
                </Typography>
                {players.length === 0 ? (
                    <Typography variant="body2" color="text.secondary">
                        暫時冇玩家加入
                    </Typography>
                ) : (
                    <TableContainer>
                        <Table size="small">
                            <TableHead>
                                <TableRow>
                                    <TableCell>#</TableCell>
                                    <TableCell>玩家名字</TableCell>
                                    <TableCell>加入時間</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {players.map((player, index) => (
                                    <TableRow key={player.id}>
                                        <TableCell>{index + 1}</TableCell>
                                        <TableCell sx={{ fontWeight: 500 }}>{player.name}</TableCell>
                                        <TableCell>{new Date(player.joinedAt).toLocaleTimeString('zh-HK')}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                )}
            </Paper>

            {/* 設定區域 + 生成按鈕 */}
            {/* ... 你原本嘅設定區域保持不變 ... */}

            {/* 結果區域 */}
            {game && (
                <Paper component={motion.div} whileHover={{ y: -4 }} transition={{ duration: 0.2 }} sx={{ p: 3, borderRadius: 4 }}>
                    <Typography variant="h6" gutterBottom>遊戲已生成！</Typography>

                    <Grid container spacing={3}>
                        <Grid item xs={12} md={7}>
                            <Typography variant="subtitle2" color="text.secondary" gutterBottom>短代碼（推薦）</Typography>
                            <Box sx={{ display: 'flex', gap: 2 }}>
                                <TextField value={game.shortCode} fullWidth InputProps={{ readOnly: true }} sx={{ fontFamily: 'monospace' }} />
                                <Button variant="contained" color="success" onClick={() => navigator.clipboard.writeText(game.shortCode)}>複製</Button>
                            </Box>
                        </Grid>
                        <Grid item xs={12} md={5}>
                            {qrCodeUrl && (
                                <Box textAlign="center">
                                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>QR Code（掃描後選擇自己）</Typography>
                                    <img src={qrCodeUrl} alt="QR Code" style={{ background: 'white', padding: 12, borderRadius: 12, maxWidth: '200px' }} />
                                </Box>
                            )}
                        </Grid>
                    </Grid>

                    <Divider sx={{ my: 3 }} />

                    <Typography variant="subtitle1" gutterBottom>完整分配表</Typography>
                    {/* ... 你原本嘅分配表 ... */}
                </Paper>
            )}
        </Box>
    )
}

export default AdminPanel