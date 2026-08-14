import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import { Accordion, AccordionDetails, AccordionSummary, Box, Typography } from '@mui/material'

const STEPS = [
  {
    title: '遊戲點玩',
    body: '大部分人攞同一個詞（好人），少數人攞一個好相似但唔同嘅詞（二五仔）。大家輪流用一句話描述自己嘅題目，唔可以講出個詞本身。描述完之後投票，好人要搵出二五仔，二五仔要混入去唔俾人發現。',
  },
  {
    title: 'Host 點開局',
    body: '入「Host 控制台」會自動建立一個房間碼。等玩家用房間碼或掃 QR 加入，見到人到齊就揀一對題目（或撳隨機選詞），再撳「生成分配」。分配表只有你睇到。',
  },
  {
    title: '玩家點入場',
    body: '入「玩家頁面」，輸入你嘅名同房間碼（或直接掃 Host 個 QR）。等 Host 生成之後，撳「查看我嘅角色」。只會顯示你自己嘅詞，千祈唔好俾隔離見到螢幕。',
  },
]

function HowToPlay({ defaultExpanded = false }) {
  return (
    <Accordion
      defaultExpanded={defaultExpanded}
      disableGutters
      sx={{
        bgcolor: 'transparent',
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: '16px !important',
        '&:before': { display: 'none' },
      }}
    >
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Typography fontWeight={700}>點樣用呢個網站？</Typography>
      </AccordionSummary>
      <AccordionDetails>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {STEPS.map((step, i) => (
            <Box key={step.title}>
              <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 0.5 }}>
                {i + 1}. {step.title}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {step.body}
              </Typography>
            </Box>
          ))}
        </Box>
      </AccordionDetails>
    </Accordion>
  )
}

export default HowToPlay
