import { useMemo, useState } from 'react'
import { Box, Button, Chip, Stack, Typography } from '@mui/material'
import { PAIR_CATEGORIES, pickRandomPair } from '../wordPairs'

function pairKey(pair) {
  return `${pair[0]}|${pair[1]}`
}

function WordPairPicker({ goodWord, traitorWord, onSelect }) {
  const [categoryId, setCategoryId] = useState('all')
  const [lastKey, setLastKey] = useState('')

  const visiblePairs = useMemo(() => {
    if (categoryId === 'all') {
      return PAIR_CATEGORIES.flatMap((c) => c.pairs)
    }
    return PAIR_CATEGORIES.find((c) => c.id === categoryId)?.pairs ?? []
  }, [categoryId])

  const selectedKey = pairKey([goodWord, traitorWord])
  const selectedSwapped = pairKey([traitorWord, goodWord])

  const handleRandom = () => {
    let picked = pickRandomPair(categoryId)
    if (!picked) return
    if (visiblePairs.length > 1 && pairKey(picked.pair) === lastKey) {
      picked = pickRandomPair(categoryId) || picked
    }
    const flip = Math.random() < 0.5
    const [a, b] = picked.pair
    onSelect(flip ? b : a, flip ? a : b)
    setLastKey(pairKey(picked.pair))
  }

  const handleSwap = () => {
    if (!goodWord && !traitorWord) return
    onSelect(traitorWord, goodWord)
  }

  return (
    <Box>
      <Stack direction="row" spacing={1} sx={{ mb: 1.5, flexWrap: 'wrap', gap: 1 }}>
        <Chip
          label="全部"
          clickable
          color={categoryId === 'all' ? 'primary' : 'default'}
          variant={categoryId === 'all' ? 'filled' : 'outlined'}
          onClick={() => setCategoryId('all')}
        />
        {PAIR_CATEGORIES.map((c) => (
          <Chip
            key={c.id}
            label={c.label}
            clickable
            color={categoryId === c.id ? 'primary' : 'default'}
            variant={categoryId === c.id ? 'filled' : 'outlined'}
            onClick={() => setCategoryId(c.id)}
          />
        ))}
      </Stack>

      <Stack direction="row" spacing={1} sx={{ mb: 1.5 }}>
        <Button variant="outlined" onClick={handleRandom} sx={{ color: 'white' }}>
          隨機選詞
        </Button>
        <Button variant="text" onClick={handleSwap}>
          對調好／壞
        </Button>
      </Stack>

      <Box
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 1,
          maxHeight: 220,
          overflow: 'auto',
          pr: 0.5,
        }}
      >
        {visiblePairs.map((pair) => {
          const key = pairKey(pair)
          const selected = key === selectedKey || key === selectedSwapped
          return (
            <Chip
              key={key}
              label={`${pair[0]} ↔ ${pair[1]}`}
              clickable
              color={selected ? 'secondary' : 'default'}
              variant={selected ? 'filled' : 'outlined'}
              onClick={() => {
                onSelect(pair[0], pair[1])
                setLastKey(key)
              }}
            />
          )
        })}
      </Box>
      <Typography variant="caption" color="text.disabled" sx={{ display: 'block', mt: 1 }}>
        兩個詞要似但唔可以係同一樣嘢。你都可以喺上面欄位自己改。
      </Typography>
    </Box>
  )
}

export default WordPairPicker
