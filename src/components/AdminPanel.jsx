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

    // ===== 即時監聽玩家列表 =====
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

    // ===== 完整題目庫 =====
    const wordPairs = [
        ["耶穌", "摩西"], ["彼得", "保羅"], ["亞當", "挪亞"], ["約翰", "雅各"],
        ["維多利亞港", "星光大道"], ["尖沙咀", "中環"], ["銅鑼灣", "灣仔"], ["旺角", "油麻地"],
        ["深水灣", "淺水灣"], ["蘭桂坊", "朗豪坊"], ["太平山頂", "山頂"], ["中環", "西環"],
        ["香港大學", "科技大學"], ["周杰倫", "林俊傑"], ["張學友", "劉德華"], ["李小龍", "成龍"],
        ["特朗普", "拜登"], ["Steve Jobs", "Elon Musk"], ["Stray Kids", "BTS"],
        ["起風了", "光年之外"], ["稻香", "聽見下雨的聲音"], ["APT.", "Flower"], ["任性", "如果可以"],
        ["蒲公英的約定", "聽媽媽的話"], ["告白氣球", "晴天"],
        ["蘋果", "香蕉"], ["漢堡", "披薩"], ["壽司", "拉麵"], ["咖啡", "奶茶"],
        ["紅酒", "啤酒"], ["巧克力", "糖果"], ["米飯", "麵條"],
        ["鋼琴", "吉他"], ["小提琴", "大提琴"], ["鼓", "電子鼓"], ["口琴", "笛子"],
        ["飛機", "火車"], ["汽車", "巴士"], ["船", "潛水艇"], ["單車", "電單車"],
        ["書本", "筆記"], ["手機", "平板"], ["眼鏡", "太陽眼鏡"], ["雨傘", "遮陽傘"],
        ["牙刷", "牙膏"], ["拖鞋", "運動鞋"], ["iPhone", "Android"], ["AirPods", "Headphones"],
        ["電腦", "筆記型電腦"], ["電視", "投影機"], ["足球", "籃球"], ["羽毛球", "網球"],
        ["泳鏡", "蛙鏡"], ["啞鈴", "槓鈴"], ["山", "海"], ["太陽", "月亮"],
        ["紅色", "藍色"], ["鑰匙", "鎖"], ["燈泡", "蠟燭"], ["鏡子", "玻璃"],
    ];

    // ===== 隨機選詞 =====
    const randomizeTopic = () => {
        const randomIndex = Math.floor(Math.random() * wordPairs.length);
        const pair = wordPairs[randomIndex];
        if (Math.random() < 0.5) {
            setGoodWord(pair[0]);
            setTraitorWord(pair[1]);
        } else {
            setGoodWord(pair[1]);
            setTraitorWord(pair[0]);
        }
    };

    const generateShortCode = (gameData) => {
        const traitorNums = gameData.assignments
            .filter(a => a.role === '二五仔')
            .map(a => a.playerNum)
            .join(',');
        const compactString = `g=${gameData.goodWord}|t=${gameData.traitorWord}|x=${traitorNums}|n=${gameData.totalPlayers}`;
        return btoa(unescape(encodeURIComponent(compactString)));
    };

    const generateQRCodeImage = async (text) => {
        try {
            const url = await QRCode.toDataURL(text, { width: 280, margin: 2 });
            setQrCodeUrl(url);
        } catch (err) {
            console.error(err);
        }
    };

    const generateGame = async () => {
        if (numTraitors >= totalPlayers) {
            alert('二五仔數量唔可以大過或等於總人數！');
            return;
        }

        // 優先使用 Firebase 玩家列表
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
            name: name,
            role: traitorSet.has(i) ? '二五仔' : '好人',
            word: traitorSet.has(i) ? traitorWord : goodWord
        }));

        const newGame = {
            totalPlayers,
            numTraitors,
            goodWord,
            traitorWord,
            assignments
        };

        newGame.shortCode = generateShortCode(newGame);
        setGame(newGame);
        generateQRCodeImage("main-room");

        // 儲存遊戲到 Firebase
        try {
            const gameRef = ref(database, 'rooms/main-room/game');
            await set(gameRef, { ...newGame, generatedAt: Date.now() });
        } catch (error) {
            console.error("儲存遊戲失敗:", error);
        }
    };

    return (
        <Box sx={{ maxWidth: 1100, mx: 'auto' }}>
            {/* Header */}
            <Box sx={{ mb: 5, display: 'flex', justifyContent: 'center' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2.5, mb: 1.5 }}>
                    {/* Icon */}
                    <Box sx={{
                        width: 52,
                        height: 52,
                        borderRadius: '16px',
                        background: 'linear-gradient(135deg, #6750A4 0%, #9A7FCF 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontSize: '1.6rem',
                        fontWeight: 700,
                        boxShadow: '0 4px 20px rgba(103, 80, 164, 0.35)'
                    }}>
                        25
                    </Box>

                    {/* 文字 */}
                    <Box>
                        <Typography variant="h4" fontWeight={700}>
                            Admin 控制台
                        </Typography>
                        <Typography variant="body1" color="text.secondary">
                            設定遊戲參數後生成分配，然後將短代碼或 QR Code 分享畀玩家
                        </Typography>
                    </Box>
                </Box>
            </Box>

            {/* ===== 即時玩家列表（優化版） ===== */}
            <Paper sx={{ p: 3, borderRadius: 4, mb: 4 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Typography variant="h6">
                            已加入玩家
                        </Typography>
                        <Chip
                            label={`${players.length} / ${totalPlayers}`}
                            color={players.length >= totalPlayers ? "success" : "primary"}
                            size="small"
                        />
                    </Box>

                    <Chip
                        label={players.length > 0 ? "即時更新中" : "等待玩家加入"}
                        color={players.length > 0 ? "success" : "default"}
                        size="small"
                        variant="outlined"
                    />
                </Box>

                {players.length === 0 ? (
                    <Box sx={{
                        py: 4,
                        textAlign: 'center',
                        bgcolor: 'action.hover',
                        borderRadius: 2
                    }}>
                        <Typography variant="body1" color="text.secondary">
                            暫時冇玩家加入
                        </Typography>
                        <Typography variant="body2" color="text.disabled" sx={{ mt: 1 }}>
                            請玩家喺 Player 頁面輸入名字加入遊戲
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
                                            <Chip
                                                label={index + 1}
                                                size="small"
                                                color="primary"
                                                variant="outlined"
                                            />
                                        </TableCell>
                                        <TableCell sx={{ fontWeight: 500 }}>
                                            {player.name}
                                        </TableCell>
                                        <TableCell align="right">
                                            <Typography variant="body2" color="text.secondary">
                                                {new Date(player.joinedAt).toLocaleTimeString('zh-HK')}
                                            </Typography>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                )}
            </Paper>

            {/* 設定區域 */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12} md={5}>
                    <Paper component={motion.div} whileHover={{ y: -4 }} transition={{ duration: 0.2 }} sx={{ p: 3, borderRadius: 4, height: '100%' }}>
                        <Typography variant="h6" gutterBottom>遊戲設定</Typography>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                            <TextField label="總玩家人數" type="number" value={totalPlayers} onChange={(e) => setTotalPlayers(parseInt(e.target.value))} fullWidth />
                            <TextField label="二五仔數量" type="number" value={numTraitors} onChange={(e) => setNumTraitors(parseInt(e.target.value))} fullWidth />
                            <TextField label="玩家名稱（可選）" multiline rows={3} value={playerNames} onChange={(e) => setPlayerNames(e.target.value)} placeholder="小明\n阿花" fullWidth />
                        </Box>
                    </Paper>
                </Grid>

                <Grid item xs={12} md={7}>
                    <Paper component={motion.div} whileHover={{ y: -4 }} transition={{ duration: 0.2 }} sx={{ p: 3, borderRadius: 4, height: '100%' }}>
                        <Typography variant="h6" gutterBottom>題目設定</Typography>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                            <TextField label="好人題目" value={goodWord} onChange={(e) => setGoodWord(e.target.value)} fullWidth />
                            <TextField label="二五仔題目" value={traitorWord} onChange={(e) => setTraitorWord(e.target.value)} fullWidth />
                            <Button variant="outlined" onClick={randomizeTopic} sx={{ alignSelf: 'flex-start', color: 'white' }}>
                                🎲 隨機選詞
                            </Button>
                            <Button variant="contained" size="large" onClick={generateGame} sx={{ mt: 1, py: 1.5, borderRadius: 3, fontWeight: 700 }}>
                                生成公平隨機分配
                            </Button>
                        </Box>
                    </Paper>
                </Grid>
            </Grid>

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
                                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>QR Code</Typography>
                                    <img src={qrCodeUrl} alt="QR Code" style={{ background: 'white', padding: 12, borderRadius: 12, maxWidth: '200px' }} />
                                </Box>
                            )}
                        </Grid>
                    </Grid>

                    <Divider sx={{ my: 3 }} />

                    <Typography variant="subtitle1" gutterBottom>完整分配表</Typography>
                    <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
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
                                    <TableRow key={a.playerNum}>
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
                </Paper>
            )}
        </Box>
    )
}

export default AdminPanel